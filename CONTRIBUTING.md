# Contribuindo para o Video Vortex

Obrigado pelo interesse em contribuir!

## Mantenedor

- **Nome:** Jônatas Bueno
- **E-mail:** jonatas.livramento@gmail.com

## Como contribuir

1. Faça um fork do repositório
2. Crie uma branch descritiva (`feat/…`, `fix/…`, `docs/…`)
3. Implemente a mudança com testes quando aplicável
4. Garanta que tudo passa:

   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

5. Abra um Pull Request descrevendo o problema e a solução

## Ambiente

- Node.js **24** (LTS) ou superior
- npm, pnpm ou yarn
- ffmpeg no `PATH` para validar a limpeza de metadados localmente

## Estilo

- TypeScript estrito
- Mensagens de commit em **português brasileiro (pt-BR)**, preferencialmente [Conventional Commits](https://www.conventionalcommits.org/)
- Evite mudanças fora do escopo do PR
- README e docs públicas devem permanecer adequados para audiência geral

## Reportar bugs

Envie um e-mail para **jonatas.livramento@gmail.com** ou abra uma issue no repositório com:

- Versão do Node e do Video Vortex
- Sistema operacional
- Passos para reproduzir
- Logs / mensagem de erro (sem dados sensíveis)

## Código de conduta (resumo)

Seja respeitoso nas discussões e reviews. Contribuições ofensivas ou fora de escopo podem ser recusadas.
