import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from './app.mjs';
import { createLedger } from './ledger.mjs';
import { verifySignature } from './webhook.mjs';
const secret = 'webhook-secret-for-tests-only';
const signed = (raw, seconds = Math.floor(Date.now()/1000)) => `t=${seconds}, v1=${createHmac('sha256',secret).update(`${seconds}.`).update(raw).digest('hex')}`;
const event = (id, name='deposit.completed', status='depix_sent', createdAt=new Date().toISOString()) => ({ id, event:name, createdAt, attempt:1, data:{id:'deposit_1',status,amountInCents:5000,feeInCents:349,netAmountInCents:4651} });
async function fixture(t, ledger = createLedger(':memory:'), configured = true) {
  const app = createApp({ ledger, env:{ DEFLOW_WEBHOOK_SECRET:configured ? secret : undefined }, fetchImpl:async()=> { throw new Error('No upstream call permitted'); } });
  const server = app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>{server.close(()=>{app.locals.close();resolve();});server.closeAllConnections();}));
  return { ledger, url:`http://127.0.0.1:${server.address().port}`, send: async (body, headers={}) => {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    return fetch(`http://127.0.0.1:${server.address().port}/api/webhooks/deflow`, {method:'POST',headers:{'Content-Type':'application/json','DF-Signature':signed(raw),'DF-Event-Id':typeof body === 'string' ? 'evt_raw' : body.id,...headers},body:raw});
  } };
}
const seed = ledger => ledger.save({id:'deposit_1',amountCents:5000,status:'pending',qrCopyPaste:'000201-PIX'});
test('signature uses exact bytes, rejects tampering, malformed HMAC and stale/future timestamps',()=>{
  const raw=Buffer.from('{ "hello": 1 }');
  assert.equal(verifySignature(raw,signed(raw),secret),true);
  assert.equal(verifySignature(Buffer.from('{"hello":1}'),signed(raw),secret),false);
  assert.equal(verifySignature(raw,`t=${Math.floor(Date.now()/1000)}, v1=a`,secret),false);
  assert.equal(verifySignature(raw,signed(raw,Math.floor(Date.now()/1000)-301),secret),false);
  assert.equal(verifySignature(raw,signed(raw,Math.floor(Date.now()/1000)+301),secret),false);
  assert.equal(verifySignature(raw,signed(raw),undefined),false);
  assert.equal(verifySignature(raw,`${signed(raw)}, v1=${'0'.repeat(64)}`,secret),false);
});
test('HTTP accepts signed events without browser Origin, deduplicates, persists and counts only completed',async t=>{
  const f=await fixture(t);seed(f.ledger);
  const approved=event('evt_approved','deposit.approved','approved');
  assert.equal((await f.send(approved)).status,202); f.ledger.drain();
  assert.equal(f.ledger.summary().count,0);
  const completed=event('evt_completed');
  assert.equal((await f.send(completed)).status,202); f.ledger.drain();
  assert.equal(f.ledger.get('deposit_1').status,'depix_sent');
  const duplicate=await f.send({...completed,attempt:2});assert.equal(duplicate.status,202);assert.equal((await duplicate.json()).duplicate,true);
  f.ledger.drain();assert.equal(f.ledger.summary().amountCents,5000);assert.equal(f.ledger.summary().count,1);
  const summary=await fetch(`${f.url}/api/campaign`);const body=await summary.json();
  assert.equal(body.count,1);assert.equal(body.recent[0].amountCents,5000);
  assert.equal(JSON.stringify(body).includes('deposit_1'),false);
});
test('refund removes totals; delayed and replayed completion never resurrects a donation',async t=>{
  const f=await fixture(t);seed(f.ledger);
  const time=Date.now();
  const completed=event('evt_completed','deposit.completed','depix_sent',new Date(time-2000).toISOString());
  await f.send(completed);f.ledger.drain();
  await f.send(event('evt_refund','deposit.refunded','refunded',new Date(time-1000).toISOString()));f.ledger.drain();
  assert.equal(f.ledger.summary().count,0);
  await f.send(event('evt_delayed','deposit.approved','approved',new Date(time-3000).toISOString()));f.ledger.drain();
  await f.send(event('evt_completed_late','deposit.completed','depix_sent',new Date(time).toISOString()));f.ledger.drain();
  assert.equal(f.ledger.get('deposit_1').status,'refunded');
  f.ledger.save({id:'deposit_1',amountCents:5000,status:'pending'});
  assert.equal(f.ledger.get('deposit_1').status,'refunded');
});
test('invalid HTTP signatures, header IDs, status and amounts do not alter records',async t=>{
  const f=await fixture(t);seed(f.ledger);
  assert.equal((await f.send(event('evt_bad'),{'DF-Signature':'bad'})).status,401);
  assert.equal((await f.send(event('evt_id'),{'DF-Event-Id':'different'})).status,400);
  assert.equal((await f.send(event('evt_status','deposit.completed','pending'))).status,400);
  assert.equal((await f.send('{not json}')).status,400);
  const wrong=event('evt_amount');wrong.data.amountInCents=6000;
  assert.equal((await f.send(wrong)).status,202);f.ledger.drain();
  assert.equal(f.ledger.event('evt_amount').state,'failed');assert.equal(f.ledger.summary().count,0);
  const unknown=event('evt_med','med.opened','open'); assert.equal((await f.send(unknown)).status,200);
  assert.equal(f.ledger.get('deposit_1').status,'pending');
  const unconfigured=await fixture(t,createLedger(':memory:'),false);
  assert.equal((await unconfigured.send(event('evt_none'))).status,503);
});
test('durable queue survives restart and event arriving before creation is retried',()=>{
  const dir=mkdtempSync(join(tmpdir(),'deflow-ledger-'));const path=join(dir,'payments.sqlite');
  try {
    let ledger=createLedger(path);ledger.enqueue(event('evt_before_create'));ledger.drain();
    assert.equal(ledger.event('evt_before_create').state,'pending');ledger.close();
    ledger=createLedger(path);seed(ledger);ledger.drain(Date.now()+2000);
    assert.equal(ledger.get('deposit_1').status,'depix_sent');assert.equal(ledger.summary().count,1);ledger.close();
    ledger=createLedger(path);assert.equal(ledger.enqueue(event('evt_before_create')),false);ledger.drain();assert.equal(ledger.summary().count,1);ledger.close();
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('sandbox never contributes to public totals; expired never counts as paid',()=>{
  const ledger=createLedger(':memory:');
  try {
    ledger.save({id:'deposit_1',status:'pending',amountCents:5000,sandbox:true});ledger.enqueue(event('evt_test'));ledger.drain();assert.equal(ledger.summary().count,0);
    ledger.save({id:'expired',status:'expired',amountCents:7000});assert.equal(ledger.summary().count,0);
  } finally {ledger.close();}
});
test('created payment is finalized by webhook and read from disk without another provider request',async t=>{
  const ledger=createLedger(':memory:');let calls=0;
  const app=createApp({ledger,env:{APP_ORIGIN:'https://campaign.example',DEFLOW_API_KEY:'key',DEFLOW_API_SECRET:'secret',PAYMENT_SIGNING_SECRET:'p'.repeat(64),DEFLOW_WEBHOOK_SECRET:secret},fetchImpl:async()=>{
    calls++;return Response.json({data:{id:'deposit_1',status:'pending',amountCents:5000,qrCopyPaste:'000201-test'}});
  }});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  t.after(()=>new Promise(resolve=>{server.close(()=>{app.locals.close();resolve();});server.closeAllConnections();}));
  const base=`http://127.0.0.1:${server.address().port}`;
  const created=await fetch(`${base}/api/donations`,{method:'POST',headers:{Origin:'https://campaign.example','Content-Type':'application/json','Idempotency-Key':'9b2f8b6e-7a2c-4f51-8a1f-0c1d3e2b9aaf'},body:JSON.stringify({amountInCents:5000,payerTaxNumber:'12345678909'})});
  assert.equal(created.status,201);const payment=await created.json();
  const raw=JSON.stringify(event('evt_raw'),null,2);
  const received=await fetch(`${base}/api/webhooks/deflow`,{method:'POST',headers:{'Content-Type':'application/json','DF-Event-Id':'evt_raw','DF-Signature':signed(raw)},body:raw});
  assert.equal(received.status,202);ledger.drain();
  const status=await fetch(`${base}/api/donations/${payment.id}`,{headers:{Authorization:`Bearer ${payment.accessToken}`}});
  assert.equal((await status.json()).status,'depix_sent');assert.equal(calls,1);
  assert.equal(ledger.summary().count,1);
});
