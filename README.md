# 🖥️ Infraestrutura — VPS us-amd-01

> Oracle Cloud ARM64 | Ubuntu 24.04 | Tailscale | Caddy

Cada diretório contém um `docker-compose.yml` que **assume o controle** de um
container já rodando no VPS, usando os **volumes e dados existentes**.

Nada é recriado do zero — os manifests servem para recriar os containers com
as **mesmas configurações** caso precisem ser restartados ou recriados.

## 📦 Serviços

| Diretório | Domínio | Stack | Porta | Volume(s) |
|-----------|---------|-------|-------|-----------|
| `caddy/` | gateway | Caddy | 80/443 | caddy-data, caddy-config |
| `home-assistant/` | ha.evolucsia.com | Python/Docker | 8123 | `l4pr3k22...ha-config` (ext) |
| `aluxen/` | aluxen.evolucsia.com | Next.js | 3000 | `b35ezft6...aluxen-data` (ext) |
| `evolucsia-site/` | evolucsia.com | Nginx | 80 | conteúdo na imagem |
| `paletto/` | paletto.space | Nginx | — | conteúdo na imagem |
| `xkull-dashboard/` | xkull.evolucsia.com | Nginx + auth | — | `j5uevde...xkull-html` (ext) |
| `hermes/` | — | Python/Docker | 2222, 9119 | 3 volumes (ext) |
| `devhost/` | devhost (SSH) | Ubuntu + Tailscale | 3322 | 3 volumes (ext) |
| `navidrome/` | media.evolucsia.com | Go | 4533 | bind mounts |
| `ntfy/` | ntfy.evolucsia.com | Go (ntfy) | 80 | ntfy-cache, ntfy-config |
| `radicale/` | calendar.evolucsia.com | Python (Radicale) | 5232 | radicale-data |
| `webdav/` | obsidian.evolucsia.com | Go (WebDAV) | 80 | obsidian-data |
| `opencode-omo/` | omoweb.evolucsia.com | OpenCode | 4096 | `opencode-omo-root` (ext) |
| `opencode-native/` | ocweb.evolucsia.com | OpenCode | 4096 | `opencode-root` (ext) |
| `odysseus/` | odysseus.evolucsia.com | FastAPI + SearXNG + ChromaDB | 7000 | 4 volumes (ext) |

## 🔄 Como assumir o controle de um serviço

Cada `docker-compose.yml` referencia os **volumes reais** que já existem no VPS
com `external: true`. Para migrar um serviço do Coolify para o Compose:

```bash
# 1. Parar o container gerenciado pelo Coolify
docker stop <container-name>
docker rm <container-name>

# 2. Subir com o compose (mesmos volumes, mesma imagem)
cd <servico>
docker compose up -d
```

O container novo vai montar os **mesmos volumes** que o antigo usava — os dados
continuam intactos.

## 🌐 Rede

O **Caddy** é o gateway principal (portas 80/443). Ele usa a rede `web`.

Os serviços migrados para Compose também usam a rede `web`, assim o Caddy
consegue rotear pelo nome do serviço.

**Enquanto não migrar:** os containers ainda no Coolify continuam na rede
`coolify` e roteados pelo Traefik. Não há downtime — a migração é gradual.

## 📋 Status Atual (22/Jun/2026)

| Serviço | Gerenciado por | Rede | Proxy |
|---------|---------------|------|-------|
| Coolify (painel) | Coolify Compose | coolify | Traefik |
| Home Assistant | Coolify | coolify | Traefik |
| Aluxen | Coolify | coolify | Traefik |
| Evolucsia Site | Coolify | coolify | Traefik |
| Paletto | Coolify | coolify | Traefik |
| xkull Dashboard | Coolify | coolify | Traefik |
| Hermes | Coolify | coolify | — |
| DevHost | Coolify | coolify | — |
| Navidrome | Coolify | dopv100... | Traefik |
| OpenCode OMO | Coolify | coolify | Traefik |
| OpenCode Native | Coolify | coolify | Traefik |
| Odysseus + SearXNG + ChromaDB + ntfy | Compose (odysseus/) | odysseus | — |
| ntfy (global) | Compose (ntfy/) | web | — |
| Radicale (Calendário) | Compose (radicale/) | web | — |
| WebDAV (Obsidian) | Compose (webdav/) | web | — |

## 🔧 Comandos Úteis

```bash
# Verificar containers rodando
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

# Logs de todos os serviços
docker compose -f caddy/docker-compose.yml logs -f

# Atualizar imagem de um serviço
cd aluxen && docker compose pull && docker compose up -d

# Listar volumes existentes
docker volume ls

# Ver detalhes de um volume
docker volume inspect <nome-do-volume>
```
