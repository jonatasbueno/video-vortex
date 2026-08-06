# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [0.1.0] - 2026-08-06

### Added

- CLI interativo **Video Vortex** (`video-vortex` / `vv`) com banner ASCII
- Detecção de plataforma por URL e seleção manual com autocomplete (↑/↓ + filtro)
- Listagem de resoluções e formatos realmente disponíveis, com tamanho em MB quando possível
- Diretório de download sugerido (`~/Downloads/VideoVortex`), com criação automática
- Nomes de arquivo `YYYYMMDDHHmmss_titulo_snake_case`
- Remoção de metadados via ffmpeg após o download
- i18n: pt-BR (padrão) e en-US (`--lang en`)
- Tipagens TypeScript publicadas no pacote
- Testes unitários e de integração (Vitest)
- Documentação: README, CONTRIBUTING e este CHANGELOG

[0.1.0]: https://github.com/jonatasbueno/video-vortex/releases/tag/v0.1.0
