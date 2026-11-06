# Histórias Únicas — pagamento pela página da DeFlow

Os três botões de doação (cabeçalho, campanha e barra fixa) abrem, na mesma aba:

https://deflow.exchange/qr/historias-unicas

O valor, o CPF/CNPJ, o Pix e a confirmação são tratados na página da DeFlow. O site não envia valores por parâmetros de URL, não coleta documentos e não marca pagamento como confirmado apenas por abrir o link. A carteira, os limites e a configuração desse QR são geridos pelo titular no painel DeFlow.

## Publicar a página

Esta versão funciona como página estática, sem configurar credenciais DeFlow ou banco de dados no site.

```sh
npm ci
npm run dev
```

Para produção:

```sh
npm run lint
npm run build
```

Publique a pasta `dist/` na hospedagem, ou selecione a branch `codex/integracao-deflow-doacoes` no fluxo de importação do GitHub. Para publicar pela branch principal, primeiro incorpore a proposta de alteração à `main`, depois republique pelo AI Studio. As alterações no GitHub não foram implantadas automaticamente nesta entrega.

`npm start` ou `npm run preview` permite conferir o build localmente. Para conferir a publicação, abra o site, clique em cada botão de doar e confirme que o navegador chega ao endereço exato acima. Abrir o link não comprova recebimento: confira as doações no painel DeFlow.

A meta da campanha foi preservada. Contadores, barra de progresso e lista de pagamentos foram retirados porque o link público não fornece esses dados ao site. Pagamentos feitos por esse QR não são automaticamente associados aos registros do servidor opcional descrito abaixo.

## Código de API opcional

O projeto conserva o servidor de integração desenvolvido anteriormente, mas ele não é usado pela página atual. `npm run dev:api` e `npm run start:api` iniciam esse servidor. Seu uso exige outra configuração e uma interface que crie cobranças individuais pela API. Não configure segredos apenas para usar o link de pagamento.

As instruções abaixo se referem exclusivamente à integração opcional por API; não são requisitos do fluxo de link público.

### Requisitos do servidor opcional

- Node >=22.13, uma instância e disco persistente para SQLite.
- `DEFLOW_API_KEY` e `DEFLOW_API_SECRET`, com scopes `read` e `transact`.
- `DEFLOW_WALLET_ID` opcional, escolhida pelo titular; sem ela, usa-se a carteira padrão da DeFlow.
- `PAYMENT_SIGNING_SECRET` aleatório, mínimo 32 caracteres e preservado entre reinícios.
- `APP_ORIGIN` com a origem HTTPS exata do servidor.
- `DATABASE_PATH` em volume persistente, por exemplo `/data/donations.sqlite`.
- `DEFLOW_WEBHOOK_SECRET`, segredo da inscrição criada no painel para `deposit.approved`, `deposit.completed`, `deposit.expired` e `deposit.refunded`, na mesma API key. Rota HTTPS: `/api/webhooks/deflow`.

Nunca configure esses segredos em código React, variáveis `VITE_`, no GitHub ou no chat. Sem cadastro local de uma cobrança criada pela API, os eventos do QR público não entram nos totais do servidor opcional. Não há conciliação automática entre os dois fluxos.

A implementação opcional verifica HMAC-SHA256 sobre o corpo bruto, tolerância de cinco minutos, idempotência por ID do evento e gravação em fila durável antes da confirmação HTTP. Os testes do servidor usam respostas simuladas e não fazem pagamentos reais. `npm test` executa esses testes. Não houve validação autenticada na conta do titular nem publicação nesta entrega.
