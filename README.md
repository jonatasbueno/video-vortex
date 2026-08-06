# Video Vortex

**Video Vortex** é um CLI interativo e colorido para baixar vídeos no terminal. Informe uma URL, escolha a plataforma (quando necessário), selecione resolução e formato disponíveis e salve o arquivo com metadados removidos.

```
npx video-vortex
```

## Requisitos

- **Node.js 24** (LTS) ou superior
- **ffmpeg** instalado e disponível no `PATH` (usado para limpar metadados do arquivo)
- Conexão com a internet

O motor de download utiliza [yt-dlp](https://github.com/yt-dlp/yt-dlp) (via `youtube-dl-exec`).

## Instalação

### Executar sem instalar

```bash
npx video-vortex
```

### npm

```bash
npm install -g video-vortex
video-vortex
```

### pnpm

```bash
pnpm add -g video-vortex
video-vortex
```

### yarn

```bash
yarn global add video-vortex
video-vortex
```

Atalho equivalente: `vv`.

## Uso

Ao iniciar, o banner **Video Vortex** é exibido. Em seguida:

1. Cole a URL do vídeo
2. Se a plataforma não for detectada, selecione na lista (↑/↓) — digite para filtrar (autocomplete)
3. Escolha resolução **e** formato entre as opções realmente oferecidas pelo vídeo (com tamanho em MB quando disponível)
4. Confirme ou altere o diretório de download (padrão: `~/Downloads/VideoVortex`)
5. Aguarde o download e a limpeza de metadados

### Exemplos

```bash
# Modo interativo
video-vortex

# URL e pasta já definidas
video-vortex --url "https://www.youtube.com/watch?v=..." --dir ~/Videos

# Interface em inglês
video-vortex --lang en
vv -l en -u "https://www.instagram.com/reel/..."
```

### Flags

| Flag | Descrição |
|------|-----------|
| `-u, --url <url>` | URL do vídeo |
| `-d, --dir <path>` | Diretório de download |
| `-l, --lang <locale>` | Idioma da UI: `pt` (padrão) ou `en` |
| `-V, --version` | Versão do pacote |
| `-h, --help` | Ajuda |

## Idioma (i18n)

- **Padrão:** português (pt-BR)
- **Inglês (en-US):** `-l en` ou `--lang en`

## Nome dos arquivos

Arquivos são salvos como:

```text
YYYYMMDDHHmmss_titulo_do_video.ext
```

O título é convertido para `snake_case`. Se o diretório informado não existir, ele é criado automaticamente.

## API / tipos TypeScript

O pacote publica tipagens embutidas (`dist/*.d.ts`). Você pode importar utilitários:

```ts
import { detectPlatform, buildFormatOptions, toSnakeCase } from 'video-vortex';
```

## Desenvolvimento

```bash
git clone https://github.com/jonatasbueno/video-vortex.git
cd video-vortex
npm install
npm test
npm run build
npm run dev
```

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para o guia de contribuição.

## Doações

Se o Video Vortex foi útil para você, doações são bem-vindas e ajudam a manter o projeto.

### PIX (Brasil)

```text
Chave PIX: f5f562f2-5361-4783-a4e8-01425073a582
```

### Carteiras crypto

```text
ETH:    0xD1A63B3b294057448bC120493d77f568300e0f5a
SOLANA: 54JdefEN2TiwRFnaZRUrwArrrkCF3pjXBHKXehLBE5hV
BTC:    bc1qpcp00msq2jnxsrkqann9jaca4ejjzcepc7gymx
```

## Licença

MIT © [Jônatas Bueno](mailto:jonatas.livramento@gmail.com)

## Aviso legal

Use o Video Vortex apenas para conteúdos que você tem o direito de baixar. Respeite os termos de serviço das plataformas e as leis de direitos autorais da sua jurisdição.
