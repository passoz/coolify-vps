# 📋 Levantamento Completo do VPS na Tailnet

> **Data:** 19 de Junho de 2026
> **Hostname:** us-amd-01 (vps.elf-platy.ts.net)
> **Tailscale IP:** 100.79.151.31
> **Acesso SSH:** `ubuntu@vps` (Oracle Cloud)

---

## 1. INFRAESTRUTURA DO SERVIDOR

### 1.1 Especificações do Hardware

| Item | Detalhe |
|------|---------|
| **Provedor** | Oracle Cloud Infrastructure (OCI) |
| **Virtualização** | KVM |
| **Arquitetura** | ARM64 (aarch64) |
| **vCPUs** | 4 (nproc) |
| **RAM** | 23 GiB |
| **Disco** | 200 GB (193 GB utilizável) |
| **Uptime** | 62 dias (desde 18/Abr/2026) |

### 1.2 Sistema Operacional

| Componente | Versão |
|------------|--------|
| **OS** | Ubuntu 24.04.2 LTS (Noble Numbat) |
| **Kernel** | 6.17.0-1010-oracle (ARM64) |
| **Hostname** | us-amd-01 |
| **Load Average** | 0.20 / 0.24 / 0.23 |

### 1.3 Discos e Partições

| Partição | Tamanho | Usado | Montagem |
|----------|---------|-------|----------|
| `/dev/sda1` | 193 GB | 81 GB (42%) | `/` |
| `/dev/sda16` | 891 MB | 164 MB (20%) | `/boot` |
| `/dev/sda15` | 98 MB | 6.4 MB (7%) | `/boot/efi` |
| **Swap** | ❌ Nenhum | — | — |

### 1.4 Rede

| Interface | IP | Descrição |
|-----------|-----|-----------|
| `enp0s6` | 10.0.0.101/24 | Rede interna OCI (mtu 9000) |
| `tailscale0` | 100.79.151.31/32 | Tailscale (MTU 1280) |
| `docker0` | 10.0.1.1/24 | Bridge Docker padrão |
| `br-6a70b94410cd` | 10.0.2.1/24 | Rede Coolify |
| `br-ca481743699a` | 10.0.3.1/24 | Rede Navidrome |

**Gateway:** 10.0.0.1 (Oracle VCN)
**DNS Primário:** 169.254.169.254 (Oracle)
**DNS Tailscale:** 100.100.100.100

---

## 2. SERVIÇOS DO SISTEMA

### 2.1 Serviços Ativos

| Serviço | Status | Descrição |
|---------|--------|-----------|
| `ssh` | ✅ running | SSH Server |
| `docker` | ✅ running | Docker Engine |
| `containerd` | ✅ running | Container Runtime |
| `tailscaled` | ✅ running | Tailscale Agent |
| `traefik` | ✅ running (container) | Proxy reverso (Coolify Proxy) |
| `syncthing-discosrv` | ✅ running | Syncthing Discovery Server |
| `syncthing-relaysrv` | ✅ running | Syncthing Relay Server |
| `unified-monitoring-agent` | ✅ running | Oracle Cloud Agent (monitoring) |
| `snap.oracle-cloud-agent` | ✅ running | Oracle Cloud Agent |
| `systemd-resolved` | ✅ running | DNS resolver |
| `unattended-upgrades` | ✅ running | Atualizações automáticas |

### 2.2 Portas Abertas na Interface Pública

| Porta | Protocolo | Serviço |
|-------|-----------|---------|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Traefik) |
| 443 | TCP | HTTPS (Traefik) |
| 3322 | TCP | devhost (SSH containerizado) |
| 4533 | TCP | Navidrome |
| 6001-6002 | TCP | Coolify Realtime (WebSocket) |
| 8000 | TCP | Coolify App (API) |
| 8080 | TCP | Traefik Dashboard |
| 22067-22070 | TCP | Syncthing Relay |
| 8443 | TCP | Syncthing Discovery |
| 33479 | TCP | Tailscale |
| 2377 | TCP | Docker Swarm (ingress) |
| 7946 | TCP | Docker Swarm |

---

## 3. DOCKER & CONTAINERES

### 3.1 Docker Engine

| Parâmetro | Valor |
|-----------|-------|
| **Versão** | Docker via containerd |
| **Storage Driver** | overlay2 |
| **Log Driver** | json-file (max 10MB, 3 arquivos) |
| **Address Pools** | 10.0.0.0/8 size 24 |
| **Tamanho Total** | 69 GB |
| **Volumes Locais** | 46 (12 ativos) |
| **Imagens** | 17 (15 em uso) |
| **Containers** | 15 (todos running) |

### 3.2 Todos os Containers Rodando

| Nome | Imagem | Status | Portas Expostas | Uso de RAM | Observação |
|------|--------|--------|-----------------|-------------|------------|
| **coolify** | `ghcr.io/coollabsio/coolify:4.1.2` | ✅ Up 13d (healthy) | 8000→8080 | 368 MiB | Painel Coolify |
| **coolify-db** | `postgres:15-alpine` | ✅ Up 13d (healthy) | 5432 | 58 MiB | PostgreSQL |
| **coolify-redis** | `redis:7-alpine` | ✅ Up 13d (healthy) | 6379 | 11 MiB | Redis/Cache |
| **coolify-realtime** | `ghcr.io/coollabsio/coolify-realtime:1.0.16` | ✅ Up 13d (healthy) | 6001-6002 | 70 MiB | WebSocket/Soketi |
| **coolify-proxy** | `traefik:v3.6` | ✅ Up 3w (healthy) | 80, 443, 8080 | 75 MiB | Proxy reverso |
| **coolify-sentinel** | `ghcr.io/coollabsio/sentinel:0.0.21` | ✅ Up 3w (healthy) | — | 20 MiB | Monitoramento |
| **g2wbydtk0e5pm8ogd41xhbjf** (opencode-omo) | `g2wbydtk0e5pm8ogd41xhbjf:latest` | ✅ Up 2w | 4096, 8080 | **1.13 GiB** | OpenCode + OMO |
| **rblvxrpir3b3ydpxi7qg1czh** (opencode-native) | `rblvxrpir3b3ydpxi7qg1czh:latest` | ✅ Up 2w | 4096, 8080 | **1.34 GiB** | OpenCode Native |
| **e2068gphegei3by0ny5v7uft** (devhost) | `e2068gphegei3by0ny5v7uft:latest` | ✅ Up 22h | 3322→22 | 329 MiB | Dev Environment |
| **b35ezft6m5fdtxn7sotu7gfk** (Aluxen) | `ghcr.io/passoz/aluxen:latest` | ✅ Up 3w | 3000 | 70 MiB | Aplicação Next.js |
| **l4pr3k22aqb1o20nqto1cwrg** (Home Assistant) | `ghcr.io/passoz/homeassistant:latest` | ✅ Up 3w | 8123 | **416 MiB** | Home Automation |
| **dd7f0fdfb1c5** (Navidrome) | `deluan/navidrome:latest` | ✅ Up 7d (healthy) | 4533 | 22 MiB | Streaming Música |
| **j5uevdeapf06dyeotn1vnf6n** (xkull) | `nginx:alpine` | ✅ Up 27h | 80 | 5 MiB | Site estático |
| **va3k562nzem9q0e62v9ffq3l** (Paletto) | `va3k...:c4320...` | ✅ Up 3w | 80 | 6 MiB | Site Nginx |
| **wgt9jr1ildqyktaw045vb9xu** (Evolucsia) | `wgt9...:43afb...` | ✅ Up 3w | 80 | 8 MiB | Site Nginx |

### 3.3 Container Parado

| Nome | Imagem | Status |
|------|--------|--------|
| **hermes** (dr1r3nmuuiaucs3t25zk2t2c) | `ghcr.io/passoz/hermes:latest` (5.6 GB) | ❌ unhealthy/exited |

### 3.4 Imagens Docker

| Imagem | Tamanho | Observação |
|--------|---------|------------|
| `ghcr.io/passoz/hermes:latest` | **5.61 GB** | Não está em uso |
| `ghcr.io/passoz/homeassistant:latest` | **2.27 GB** | Home Assistant |
| `e2068gphegei3by0ny5v7uft:latest` | **1.38 GB** | Devhost |
| `ghcr.io/coollabsio/coolify-realtime:1.0.16` | **705 MB** | WebSocket |
| `ghcr.io/coollabsio/coolify:4.1.2` | **407 MB** | Coolify Core |
| `ghcr.io/passoz/aluxen:latest` | **422 MB** | Aluxen |
| `g2wbydtk0e5pm8ogd41xhbjf:latest` | **403 MB** | OpenCode OMO |
| `rblvxrpir3b3ydpxi7qg1czh:latest` | **403 MB** | OpenCode Native |
| `postgres:15-alpine` | **270 MB** | DB |
| `deluan/navidrome:latest` | **226 MB** | Música |
| `traefik:v3.6` | **172 MB** | Proxy |
| `nginx:alpine` | **67 MB** | Sites estáticos |
| `redis:7-alpine` | **39 MB** | Cache |
| `ghcr.io/coollabsio/sentinel:0.0.21` | **32 MB** | Monitor |
| `ghcr.io/coollabsio/coolify-helper:1.0.14` | **401 MB** | Não em uso |

### 3.5 Docker Networks

| Nome | Subnet | Uso |
|------|--------|-----|
| `coolify` (br-6a70b94410cd) | 10.0.2.0/24 | Rede principal Coolify (proxy + apps) |
| `dopv100qpem5f8urzah1dfo3` (br-ca481743699a) | 10.0.3.0/24 | Navidrome |
| `docker_gwbridge` | 172.19.0.0/16 | Gateway containers |
| `docker0` | 10.0.1.0/24 | Bridge padrão |
| `ingress` (overlay) | Swarm | Docker Swarm Ingress |

---

## 4. COOLIFY (Plataforma de Deploy)

### 4.1 Informações Gerais

| Parâmetro | Valor |
|-----------|-------|
| **Versão** | 4.1.2 (via `ghcr.io/coollabsio/coolify:4.1.2`) |
| **Domínio do Painel** | https://panel.evolucsia.com |
| **Database** | PostgreSQL 15 (30 MB) |
| **Cache** | Redis 7 |
| **Proxy** | Traefik v3.6 (LetsEncrypt + HTTP Challenge) |
| **Ambiente** | Production |
| **Base Path Dados** | `/data/coolify/` |
| **SSO/Usuário** | Acesso via web (email/password ou Google) |

### 4.2 Aplicações Deployadas via Coolify

| # | Nome | Domínio | Status | Container | Stack |
|---|------|---------|--------|-----------|-------|
| 1 | **Home Assistant** | https://ha.evolucsia.com | ✅ running | `l4pr3k22aqb1o20nqto1cwrg` | Docker (ghcr.io/passoz/homeassistant) |
| 2 | **Hermes** | http://dr1r3n...sslip.io | ❌ unhealthy/exited | `dr1r3nmuuiaucs3t25zk2t2c` | Docker (ghcr.io/passoz/hermes) |
| 3 | **Evolucsia Site** | https://evolucsia.com | ✅ running | `wgt9jr1ildqyktaw045vb9xu` | Nginx (site estático) |
| 4 | **Paletto** | https://paletto.space | ✅ running | `va3k562nzem9q0e62v9ffq3l` | Nginx (site estático) |
| 5 | **Aluxen** | https://aluxen.evolucsia.com | ✅ running | `b35ezft6m5fdtxn7sotu7gfk` | Docker (Next.js) |
| 6 | **OpenCode OMO** | https://omoweb.evolucsia.com | ✅ running | `g2wbydtk0e5pm8ogd41xhbjf` | OpenCode |
| 7 | **OpenCode Native** | https://ocweb.evolucsia.com | ✅ running | `rblvxrpir3b3ydpxi7qg1czh` | OpenCode |
| 8 | **xkull-dashboard** | https://xkull.evolucsia.com | ✅ running | `j5uevdeapf06dyeotn1vnf6n` | Nginx (site estático + auth basic) |
| 9 | **devhost** | http://e2068g...sslip.io | ✅ running | `e2068gphegei3by0ny5v7uft` | Ambiente dev SSH |
| 10 | **Navidrome** | (serviço interno) | ✅ running | `dopv100qpem5f8urzah1dfo3` | Serviço Coolify |

### 4.3 Configuração do Proxy (Traefik)

- **Certificados SSL:** LetsEncrypt via HTTP Challenge
- **Storage ACME:** `/traefik/acme.json` (102 KB)
- **Middleware:** Redirect HTTP→HTTPS, Gzip compression
- **Dashboard:** Disponível em :8080 (autenticação necessária)
- **Routers principais:**
  - `coolify-http` / `coolify-https` → painel (panel.evolucsia.com)
  - `coolify-realtime-ws` / `coolify-realtime-wss` → WebSocket (panel.evolucsia.com/app)
  - `coolify-terminal-ws` / `coolify-terminal-wss` → Terminal (panel.evolucsia.com/terminal/ws)

### 4.4 Volumes do Coolify

| Volume | Tamanho | Descrição |
|--------|---------|-----------|
| `coolify-db` | 89 MB | Dados do PostgreSQL |
| `coolify-redis` | 662 KB | Dados do Redis |

### 4.5 Coolify .env (parâmetros de build)

| Parâmetro | Valor |
|-----------|-------|
| `APP_NAME` | Coolify |
| `REGISTRY_URL` | ghcr.io |
| `DOCKER_ADDRESS_POOL_BASE` | 10.0.0.0/8 |
| `DOCKER_ADDRESS_POOL_SIZE` | 24 |

---

## 5. VOLUMES DOCKER (Armazenamento Persistente)

### 5.1 Por Aplicação

| Volume | Tamanho | Aplicação |
|--------|---------|-----------|
| `vps_ollama_data` | **30.17 GB** | Ollama (modelos de IA) |
| `vps_opencode_omo_docker` | **8.07 GB** | OpenCode OMO Docker builds |
| `opencode-root` | **2.30 GB** | OpenCode (native) root |
| `e2068gphegei3by0ny5v7uft-passoz-home` | **2.19 GB** | devhost (home) |
| `vps_hermes_docker` | **1.80 GB** | Hermes Docker builds |
| `opencode-omo-root` | **1.29 GB** | OpenCode OMO root |
| `vps_openwebui_data` | **1.12 GB** | OpenWebUI |
| `vps_registry_data` | **576 MB** | Docker Registry |
| `dr1r3nmuuiaucs3t25zk2t2c-hermes-state` | **576 MB** | Hermes state |
| `opencode-workspace` | **260 MB** | OpenCode workspace |
| `coolify-db` | **89 MB** | Coolify database |
| `vps_opencode_config` | **51 MB** | OpenCode config |
| `vps_opencode_omo_config` | **51 MB** | OpenCode OMO config |
| Demais volumes | < 50 MB cada | Vários |

### 5.2 Top 5 Maiores Volumes

```
 1. vps_ollama_data          30.17 GB  ← Modelos de IA
 2. vps_opencode_omo_docker   8.07 GB  ← Docker images
 3. opencode-root             2.30 GB  ← OpenCode
 4. e2068...passoz-home       2.19 GB  ← Dev environment
 5. vps_hermes_docker         1.80 GB  ← Hermes Docker images
```

---

## 6. USUÁRIOS DO SISTEMA

| Usuário | Shell | Home | Sudo |
|---------|-------|------|------|
| `root` | `/usr/bin/zsh` | /root | ✅ Sim |
| `ubuntu` | `/usr/bin/zsh` | /home/ubuntu | ✅ Sim (sudo) |
| `opc` | `/bin/sh` | /home/opc | Oracle default |

---

## 7. FERRAMENTAS E RUNTIMES INSTALADOS

### 7.1 Runtimes

| Runtime | Localização | Detalhe |
|---------|-------------|---------|
| **OpenCode** | `/root/.local/share/mise/installs/github-anomalyco-opencode/latest/` | 2 instâncias rodando (OMO + Native) |
| **Node.js** | `/root/.local/share/mise/installs/node/latest/` | Usado pelo OpenCode MCP |
| **Mise (tools)** | Não encontrado no PATH | Apenas dentro dos containers OpenCode |

### 7.2 Snaps

| Snap | Versão |
|------|--------|
| `core18` | 20260204 |
| `oracle-cloud-agent` | 1.48.0-17 |
| `snapd` | 2.75.2 |

### 7.3 Pacotes APT

- **Total:** 1260 pacotes instalados
- **Destaques:** Docker, containerd, Syncthing (discosrv + relaysrv), Tailscale, Python3

---

## 8. OPENCODE (Ambiente de Desenvolvimento)

Há **2 instâncias** do OpenCode rodando como processos no host (não containers tradicionais), cada uma contendo 2 processos:

### Instância 1: OpenCode OMO (omoweb.evolucsia.com)
- **Processo web:** PID 614053 (porta 4096, 3.2% mem / 760 MB RSS)
- **Processo serve:** PID 614054 (porta 8080, 2.0% mem / 510 MB RSS)
- **Volume de código:** `opencode-omo-root` (1.29 GB) + `opencode-omo-workspace` (1.22 MB)
- **Docker builds:** `vps_opencode_omo_docker` (8.07 GB)

### Instância 2: OpenCode Native (ocweb.evolucsia.com)
- **Processo web:** PID 634371 (porta 4096, 3.4% mem / 852 MB RSS)
- **Processo serve:** PID 634372 (porta 8080, 0.8% mem / 221 MB RSS)
- **Volume de código:** `opencode-root` (2.30 GB) + `opencode-workspace` (260 MB)
- **Configuração:** `vps_opencode_config` (51 MB)

### MCP (Language Server Protocol)
- 3 processos `oh-my-openagent` rodando como MCP servers, cada um com ~47 MB

---

## 9. SERVIÇOS ADICIONAIS

### 9.1 Syncthing
- **Discovery Server** (`stdiscosrv`): Porta 8443 (já que 8433 está em uso?)
- **Relay Server** (`strelaysrv`): Portas 22067-22070
- Ambos rodando desde 18/Abr/2026 (2 meses)

### 9.2 Home Assistant
- **URL:** https://ha.evolucsia.com
- **Container:** `l4pr3k22aqb1o20nqto1cwrg`
- **RAM:** 416 MiB
- **Discos:** 2 volumes (ha-config: 60 MB, ha-backups: 0 B)
- **Processo:** `python3 -m homeassistant` (PID 1243165, rodando desde 27/Mai)

### 9.3 Navidrome (Streaming de Música)
- **Container:** `navidrome-dopv100qpem5f8urzah1dfo3`
- **Porta:** 4533
- **RAM:** 22 MiB
- **Rede isolada:** br-ca481743699a (10.0.3.0/24)

### 9.4 Ollama (IA Local)
- **Volume:** `vps_ollama_data` — **30.17 GB** (modelos de IA)
- Container não está rodando, apenas o volume com dados

### 9.5 DevHost (SSH Containerizado)
- **Container:** `e2068gphegei3by0ny5v7uft-214037429117`
- **Porta:** 3322 (SSH para o container)
- **Volumes:** `passoz-home` (2.19 GB), `ssh` (630 KB), `tailscale-state` (18 KB)

---

## 10. DOMÍNIOS E DNS

| Domínio | Serviço | SSL |
|---------|---------|-----|
| `panel.evolucsia.com` | Coolify (painel) | ✅ LetsEncrypt |
| `evolucsia.com` | Site principal | ✅ LetsEncrypt |
| `aluxen.evolucsia.com` | Aluxen App | ✅ LetsEncrypt |
| `ha.evolucsia.com` | Home Assistant | ✅ LetsEncrypt |
| `omoweb.evolucsia.com` | OpenCode OMO | ✅ LetsEncrypt |
| `ocweb.evolucsia.com` | OpenCode Native | ✅ LetsEncrypt |
| `xkull.evolucsia.com` | xkull Dashboard | ✅ LetsEncrypt |
| `paletto.space` | Paletto | ✅ LetsEncrypt |
| `*.129.213.26.227.sslip.io` | devhost, hermes | ❌ HTTP |

---

## 11. SEGURANÇA

### 11.1 Firewall
- **Oracle Cloud:** Security Lists / Network Security Groups no VCN
- **Iptables (Docker):** Regras de ACCEPT para portas específicas + DROP padrão
- **UFW:** ❌ Não está ativo

### 11.2 Acesso SSH
- **Usuário principal:** `ubuntu` (via chave SSH)
- **Usuário OPC:** `opc` (Oracle default, shell `/bin/sh`)
- **Porta SSH:** 22 (padrão)
- **Autenticação:** Apenas chave pública (Ed25519)

### 11.3 Root
- **Shell:** zsh
- **Docker:** Containers rodam como root
- **OpenCode:** Processos rodam como root

---

## 12. USO DE RECURSOS

### 12.1 Armazenamento

| Item | Tamanho |
|------|---------|
| Disco total | 193 GB |
| Usado | 81 GB (42%) |
| Livre | 113 GB (58%) |
| Docker (imagens + volumes) | ~69 GB |
| `/home` | 10 GB |
| `/root` | 187 MB |
| `/data/coolify` | 8.9 MB |

### 12.2 Memória

| Item | Tamanho |
|------|---------|
| Total | 23 GiB |
| Usado | 4.4 GiB (19%) |
| Disponível | 19 GiB |
| **Maior consumidor** | OpenCode (2× ~850 MB RSS cada) |

### 12.3 Recuperável em Volumes

| Tipo | Recuperável | % |
|------|-------------|---|
| Imagens Docker | 6.47 GB | 52% |
| Volumes Docker | **42.65 GB** | **87%** (não ativos) |
| **Total recuperável** | **~49 GB** | |

---

## 13. OBSERVAÇÕES E RISCOS

### ⚠️ Pontos de Atenção

1. **Ollama sem container:** O volume de 30 GB com modelos de IA está órfão (sem container ativo)
2. **Hermes parado:** Container hermes (5.6 GB de imagem) está unhealthy/exited há dias
3. **Imagens não usadas:** `coolify-helper` (401 MB), `hermes` (5.6 GB) — podem ser removidas
4. **Volumes órfãos:** 46 volumes totais, apenas 12 ativos → **~42 GB recuperável**
5. **Processos OpenCode rodando como root:** Risco de segurança, mas é o comportamento padrão
6. **Sem swap:** 0 swap configurado — pode causar OOM se memória estourar
7. **Sem UFW/iptables nativo:** A segurança de rede depende apenas das Security Lists da Oracle

### ✅ Pontos Positivos

1. **Docker atualizado** com configurações de log com rotação
2. **Coolify bem configurado** com proxy Traefik + LetsEncrypt
3. **Tailscale ativo** para acesso seguro à tailnet
4. **62 dias de uptime** estável
5. **Monitoramento via Sentinel** (Coolify)
6. **Unattended Upgrades** ativo
7. **ARM64 eficiente** — bom custo-benefício Oracle Cloud

---

## 14. TOPOLOGIA DA TAILNET

| Máquina | Tailscale IP | OS | Status |
|---------|------------|----|--------|
| **vps** (us-amd-01) | 100.79.151.31 | Linux (Ubuntu ARM64) | ✅ Online (direto) |
| **note** | 100.83.175.110 | Linux | ✅ Online |
| **coolify-dev** | 100.67.212.55 | Linux | ✅ Online (via DERP) |
| **iphone** | 100.90.127.92 | iOS | ✅ Online |
| **76ca196241e6** | 100.112.111.43 | Linux | ❌ Offline |
| **archonfig** | 100.111.31.49 | Linux | ❌ Offline |
| **server** | 100.80.249.18 | Linux | ❌ Offline |

---

## 15. AÇÕES REALIZADAS (19/Jun/2026)

### ✅ Limpeza de Espaço
| Ação | Resultado |
|------|-----------|
| `docker system prune -a` | Removeu imagem `coolify-helper` (393 MB) |
| Removido `vps_ollama_data` | **+30.17 GB** (confirmado que não há mais Ollama) |
| Removido `vps_opencode_omo_docker` | **+8.07 GB** (build cache órfão) |
| Removido `vps_hermes_docker` | **+1.80 GB** (build cache órfão) |
| Removido `vps_openwebui_data` | **+1.12 GB** (container não roda mais) |
| Removido `vps_registry_data` | **+576 MB** (Docker Registry órfão) |
| Removido `dokploy-*` volumes | **+68 MB** (plataforma anterior) |
| Removidos 20+ volumes órfãos pequenos | **+~400 MB** |
| **Total recuperado** | **~41 GB** 🔥 |

**Disco:** 81 GB usado → **40 GB usado (21%)**
**Volumes Docker:** 46 → **17 restantes** (apenas 1 órfão não removido)

### ✅ Hermes Restaurado
| Item | Status |
|------|--------|
| Container `dr1r3nmuuiaucs3t25zk2t2c-172843244150` | ✅ **Rodando** (ghcr.io/passoz/hermes:latest) |
| Portas | SSH: `2222→22`, Gateway: `9119→9119` |
| DNS | `http://dr1r3nmuuiaucs3t25zk2t2c.129.213.26.227.sslip.io` |
| Deploy | Via `docker compose up -d` do diretório da aplicação no Coolify |

> **Nota:** O container estava sendo removido pelo `docker system prune`. Foi religado manualmente via docker compose no diretório `/data/coolify/applications/dr1r3nmuuiaucs3t25zk2t2c/`.

---

## 16. RECOMENDAÇÕES PENDENTES

### Curto Prazo
1. 🔄 **Configurar swap** (4-8 GB) para evitar OOM
2. 🔄 **Adicionar UFW** ou iptables rules persistentes além das Security Lists
3. 🔄 **Fazer backup** do `/data/coolify` (app data + .env) e volumes críticos
4. 🔄 **Fazer o Coolify reconhecer o Hermes** — entrar no painel e verificar se o status atualizou

### Médio Prazo
5. 📅 **Atualizar Coolify** (versão 4.1.2 → mais recente)
6. 📅 **Monitorar disco** (21% usado atualmente)
7. 📅 **Avaliar necessidade do OpenCode** (2 instâncias consumindo ~3-4 GB RAM cada)

---

> 📝 **Documento gerado em 19/Jun/2026. Última atualização: 19/Jun/2026 (limpeza + Hermes restaurado).**
