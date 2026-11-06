# Histórias Únicas — doações com DeFlow

Página React/Vite com servidor Node/Express. O doador paga Pix em BRL; a DeFlow desconta as taxas e envia DePix à carteira Liquid da conta. Não se trata de recebimento direto em reais numa conta bancária.

## Situação da entrega

O código está na branch `codex/integracao-deflow-doacoes`, em proposta de alteração para `main`. Não foi publicado na hospedagem nem configurado com credenciais reais. O site publicado em `https://hist-rias-nicas.ai.studio/` foi inspecionado e ainda contém a versão original com QR ilustrativo/chave fixa e simulação de confirmação; a rota `/api/donations/quote` nesse endereço respondeu HTML em vez de JSON na inspeção. Publicar a página original não ativa esta integração.

## Executar

Node.js >=22.13 (testado em Node 24). O SQLite usa o módulo `node:sqlite` incluído no Node.

```sh
npm ci
cp .env.example .env
# Preencha .env somente no servidor ou no gerenciador de segredos da hospedagem.
# Gere PAYMENT_SIGNING_SECRET com: openssl rand -hex 32
npm run dev
```

Abra http://localhost:3000. Sem credenciais, a página pode ser visualizada, mas as rotas de criação/cotação informam que o recebimento não foi configurado.

## Conectar sua conta

1. No painel DeFlow, cadastre e confira a carteira Liquid de destino.
2. Crie uma API key com scopes `read` e `transact`. Guarde API key e API secret somente no servidor. Comece em sandbox, se disponível na sua conta.
3. Configure as variáveis na hospedagem:
   - `DEFLOW_API_KEY`: chave da API.
   - `DEFLOW_API_SECRET`: secret usado em `X-DF-Secret`.
   - `DEFLOW_WALLET_ID`: opcional; ID da carteira Liquid da sua conta. Sem ele, a DeFlow escolhe a carteira padrão ou a Liquid mais recente, conforme sua documentação.
   - `PAYMENT_SIGNING_SECRET`: segredo aleatório da aplicação, mínimo 32 caracteres. Preserve entre reinícios; autoriza a consulta individual por sete dias.
   - `APP_ORIGIN`: origem pública exata, HTTPS e sem barra final. Para usar o endereço atual, `https://hist-rias-nicas.ai.studio`; somente após publicar o servidor nesse endereço.
   - `DATABASE_PATH`: caminho do SQLite em um volume persistente. Exemplo: `/data/donations.sqlite`. O padrão local é `./data/donations.sqlite`.
   - `PORT`: porta HTTP, padrão 3000.
4. No painel **Desenvolvedores** da DeFlow, na **mesma API key** usada pela aplicação, crie uma inscrição de webhook:
   - URL: `https://SEU-DOMINIO/api/webhooks/deflow`.
   - Eventos: `deposit.approved`, `deposit.completed`, `deposit.expired`, `deposit.refunded`.
   - Copie o segredo da inscrição, exibido uma única vez, para `DEFLOW_WEBHOOK_SECRET` no servidor. Esse segredo é diferente do API secret e do `PAYMENT_SIGNING_SECRET`.
5. Reinicie/republique o servidor após configurar os segredos. Não gere o segredo de assinatura da aplicação a cada reinício.
6. Valide em sandbox com uma cobrança da página e o mecanismo de simulação oferecido pela DeFlow. Confira no painel se a entrega do webhook retornou 2xx. A marca sandbox não permite mostrar doação real nem entrar nos totais.
7. Antes de divulgar, valide o recebimento real com uma pequena contribuição consentida: confira valor e recebedor no banco, o status no painel e o recebimento de DePix na carteira. A primeira transação da conta pode ter limite de R$ 30,00. Gere, pague e feche a página; reabra depois para conferir o registro. Reenviar o mesmo evento no painel não deve aumentar o total novamente.

Nunca coloque essas credenciais em código React, variáveis `VITE_`, GitHub ou mensagens de chat. Nome/WhatsApp foram removidos do fluxo porque não são usados. CPF/CNPJ segue para a DeFlow, mas não é persistido no banco desta aplicação.

## Hospedagem

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```

A hospedagem deve executar o servidor Node e servir `/api` e a página na mesma origem HTTPS. Publicar apenas `dist/` não executa a integração. O comando de desenvolvimento inicia Express e Vite juntos.

**Esta versão exige uma instância Node com disco persistente para o banco SQLite**, incluindo seus arquivos WAL/SHM. Não publique o banco em uma pasta de arquivos públicos. Faça backup com uma ferramenta consistente com SQLite (por exemplo, SQLite backup); não copie somente o arquivo principal com o servidor gravando. Ambientes com disco efêmero, múltiplas réplicas, funções isoladas ou apenas hospedagem estática exigem adaptação para banco/fila compartilhados antes da ativação. Não foi confirmada a compatibilidade da hospedagem do AI Studio com esse requisito.

O processo encerra a conexão HTTP e fecha o banco ao receber SIGTERM/SIGINT. O controle de chamadas à DeFlow também é local ao processo: use uma instância dedicada à API key. Outros consumidores da mesma chave ou escala horizontal exigem limites distribuídos. Proteja a rota pública de criação contra abuso na hospedagem antes de divulgar amplamente.

## Comportamento financeiro

- Valores em centavos, de R$ 5,00 a R$ 6.000,00 por cobrança; a DeFlow aplica seus limites adicionais por pagador.
- Cotação `net` e exibição dos valores/taxa efetiva retornados pela DeFlow. A taxa não é recalculada no navegador.
- `POST /v1/deposit/create` com CPF/CNPJ obrigatório. A carteira é escolhida no servidor; dados enviados pelo visitante não alteram o destino.
- QR Code gerado localmente a partir do `qrCopyPaste` real. Não se envia documento/código a um serviço externo de imagens.
- Idempotency key preservada em timeouts/falhas ambíguas. Repetir exige o mesmo valor e documento. O navegador guarda somente a chave da tentativa e um hash dos parâmetros, sem documento em texto. A trava de valor repetido não é contornada alterando centavos automaticamente.
- Os recibos financeiros e a fila de eventos são persistidos em SQLite, sem CPF/CNPJ, nomes ou telefone. Eventos só atualizam cobranças registradas por esta integração, com o mesmo valor.
- Eventos aprovados não entram no total. Sucesso exige `depix_sent` fora de sandbox. Estornos retiram a contribuição dos totais. Eventos repetidos ou atrasados não fazem um estorno voltar a contar como pago.
- O total público representa valores brutos antes das taxas e o número de cobranças confirmadas, não doadores únicos. A lista recente é anônima e mostra no máximo 20 contribuições. O histórico anterior da conta não é importado. As estatísticas fictícias originais foram removidas.
- A página atualiza o resumo a cada 30 segundos. A confirmação individual é consultada com backoff de 15 a 60 segundos; o servidor usa o banco para estados terminais e a API como fallback. Fechar o navegador não interrompe o processamento do webhook no servidor.
- O navegador guarda ID/autorização da cobrança para retomá-la no mesmo navegador. O estado é revalidado. A autorização não deve ser incluída em logs ou compartilhada.

## Recebimento dos webhooks

`POST /api/webhooks/deflow` usa o corpo bruto antes do parser JSON. Verifica HMAC-SHA256 de `{timestamp}.{corpo-bruto}`, comparação constante, assinatura hexadecimal e tolerância de 300 segundos em ambas as direções. O `DF-Event-Id` deve corresponder ao ID do envelope. A rota não exige Origin de navegador; sua autenticação é a assinatura.

A aplicação grava o evento normalizado em fila durável antes de responder 202. Erros de gravação não recebem confirmação de sucesso, permitindo retentativas da DeFlow. Um worker processa a fila após a resposta e ao reiniciar, aplicando evento e atualização de pagamento na mesma transação. A restrição única no ID estável evita duplicidade inclusive quando o campo `attempt` muda.

Eventos que chegam antes do registro da cobrança são tentados novamente, com backoff, por até 24 horas. Depois ficam `ignored` com motivo `unknown_deposit`; pagamentos de outras integrações não entram nos totais. Divergência de valor fica `failed` com motivo `amount_mismatch`, sem alterar a cobrança. Eventos desconhecidos, como MED, recebem 200 e são ignorados; esta página de doação não bloqueia usuários por MED. Eventos sem assinatura, expirados ou inconsistentes são rejeitados.

No painel DeFlow, acompanhe entregas `dead` e inscrições desativadas. Reenviar entrega duplicada é seguro. Se houver eventos internos `failed`, investigue antes de alterar os registros; o payload financeiro normalizado e o motivo ficam na tabela `events` do SQLite, acessível somente pelo responsável pelo servidor. Os registros e a fila precisam de política de retenção/backup conforme o volume. Não há painel administrativo próprio nesta entrega; use o painel DeFlow para gerir a conta.

## Verificação e limitações

`npm run lint`, `npm run build` e `npm test`. Os testes simulam a DeFlow; cobrem criação, cotação, valor e carteira, autorização de consulta, erros, sandbox, assinatura sobre bytes exatos, replay, eventos fora de ordem, estorno, idempotência, reinício e a corrida entre webhook e criação. Não houve cobrança real nem teste autenticado na conta do titular. A ativação depende de credenciais, inscrição de webhook, hospedagem compatível e validação na conta.
