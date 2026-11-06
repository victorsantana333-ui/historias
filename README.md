# Histórias Únicas — integração DeFlow

Página React/Vite com servidor Node/Express. O servidor cria cobranças Pix e consulta a DeFlow sem expor a API key e o secret ao navegador. O pagamento em BRL é convertido em DePix e enviado à carteira Liquid da conta, descontadas as taxas. Não é uma transferência direta em reais para uma conta bancária.

## Executar

Requer Node.js 22 ou superior.

```sh
npm ci
cp .env.example .env
# Preencha .env somente no servidor ou no gerenciador de segredos da hospedagem.
# Gere PAYMENT_SIGNING_SECRET com: openssl rand -hex 32
npm run dev
```

Abra http://localhost:3000. O aplicativo pode ser visualizado sem credenciais; as rotas de pagamento retornam uma mensagem de indisponibilidade até que sejam configuradas.

### Configuração

- `DEFLOW_API_KEY`: chave da conta DeFlow com scopes `transact` e `read`.
- `DEFLOW_API_SECRET`: secret correspondente (`X-DF-Secret`).
- `DEFLOW_WALLET_ID`: opcional; carteira Liquid da sua conta. Sem esse campo, a DeFlow usa a carteira padrão, ou a Liquid mais recente, conforme sua documentação. Confirme a carteira no painel antes de habilitar o recebimento.
- `PAYMENT_SIGNING_SECRET`: segredo aleatório com pelo menos 32 caracteres. Preserve entre reinícios e instâncias; ele assina a autorização de consulta de cada cobrança por sete dias.
- `APP_ORIGIN`: origem exata da página, sem barra final. Exemplo local: `http://localhost:3000`. Produção: `https://seu-dominio.com.br`.
- `PORT`: porta HTTP, padrão 3000.

Nunca use prefixos `VITE_` para esses segredos. Não envie `.env` ao GitHub. Não inclua as chaves em prompts do AI Studio ou no código do React.

### Produção

```sh
npm ci
npm run lint
npm test
npm run build
npm start
```

A hospedagem deve executar Node e servir tanto a página quanto `/api` na mesma origem HTTPS. Apenas publicar `dist/` em uma hospedagem estática não executa a integração. No AI Studio, o comando de desenvolvimento passa a ser `npm run dev`, iniciando o Express e o Vite juntos. Configure as variáveis no ambiente que realmente executará o servidor.

## Fluxo implementado

1. Seleção do valor; mínimo da campanha R$ 5,00, teto de R$ 6.000,00 por cobrança. A DeFlow aplica seus limites adicionais por pagador e pode limitar a primeira transação da conta a R$ 30,00.
2. Cotação pelo servidor em `/v1/depix/quote`, modo `net`, antes de habilitar a geração. A taxa efetiva e os valores líquidos são exibidos conforme a API, sem recalcular taxas no cliente.
3. CPF/CNPJ obrigatório do pagador. O servidor confere formato e a DeFlow valida o documento. O documento não é salvo pelo aplicativo nem enviado para serviços de QR Code. As informações necessárias seguem para a DeFlow para processamento.
4. Criação por `/v1/deposit/create`, valor exato em centavos, destino da carteira definido no servidor. O adicional opcional de R$ 4,99 integra o total da doação e não garante compensação integral das taxas.
5. QR Code gerado localmente com o `qrCopyPaste` real, inclusive quando a DeFlow não envia imagem. Não se usa o QR ilustrativo original.
6. Consulta com backoff de 15 a 60 segundos, sem chamadas simultâneas dentro do mesmo fluxo. Sucesso apenas com `depix_sent` e sem `sandbox`. `expired`, `canceled`, `refunded` e `error` encerram a consulta sem sucesso.
7. Identificador e autorização da cobrança ficam no navegador para retomar a consulta após recarregar ou voltar à página no mesmo navegador. O status salvo é revalidado no servidor. Não salve esse token em logs: ele autoriza consultar essa cobrança. CPF/CNPJ, nome e telefone não são persistidos.

Cada tentativa tem chave de idempotência que é preservada após falhas ambíguas/timeouts. Nesse caso, repetir exige o mesmo CPF/CNPJ e valor. A identificação local da tentativa usa hash, sem armazenar o documento em texto. Não altere centavos automaticamente para contornar `DUPLICATE_AMOUNT_RECENT`; retome a cobrança anterior ou aguarde a janela informada pela DeFlow. Não há débito automático: criar cobrança não confirma pagamento.

## Limites desta entrega

- Não foram feitas cobranças reais: faltam as credenciais e a validação com a conta do titular. Use primeiro uma chave sandbox e confira o fluxo antes de habilitar dinheiro real. Sandbox é sinalizado e nunca mostra confirmação de doação real.
- Não há webhook nesta versão: a seção 17 e a especificação da assinatura ainda não foram fornecidas. Fechar a página não cancela uma cobrança existente; a DeFlow continua processando, mas a aplicação só retoma a consulta quando for aberta. Não há processamento próprio em segundo plano.
- Não há banco de dados, conciliação, total arrecadado real, lista pública real ou painel administrativo próprio. O total e os apoiadores anteriores continuam ilustrativos, sinalizados na página. Os campos de nome e WhatsApp originais foram removidos porque não são usados pelo fluxo financeiro desta versão. Para gerenciar a conta e as doações, use o painel DeFlow; uma futura versão deve usar registros persistentes e webhooks para consolidar totais.
- Controle de chamadas e cache são locais ao processo e conservadores em relação aos limites documentados. Esta versão deve operar com uma instância dedicada a essa chave. Escala horizontal, múltiplos sites ou outros consumidores da mesma chave exigem limite distribuído e fila compartilhada. A rota pública de criação também deve receber proteção contra abuso na hospedagem antes de divulgação ampla.
- Nenhuma chave foi incluída no projeto e nenhuma publicação em hospedagem foi realizada. O código é entregue em uma branch de revisão no GitHub. Revise também textos e dados da campanha antes de publicar.

## Verificação

`npm run lint`, `npm run build` e `npm test`. Os testes usam respostas simuladas da DeFlow para verificar valor e carteira, idempotência encaminhada, restrição de consultas, limites de entrada, erros, cotação e sandbox; não fazem solicitações financeiras externas.
