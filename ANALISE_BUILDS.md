# 🔍 Serviços que dependem de Dockerfile/build do Coolify

> Análise feita em 23/Jun/2026 a partir de `docker history` e `docker inspect`.

## Resumo

| # | Serviço | Status | Imagem | Origem |
|---|---------|--------|--------|--------|
| 1 | **evolucsia-site** | 🔴 Build Coolify | `wgt9jr1...:43afb...` | Repo `passoz/evolucsia` no GitHub |
| 2 | **paletto** | 🔴 Build Coolify | `va3k562...:c4320...` | Repo `passoz/paletto` no GitHub |
| 3 | **opencode-omo** | 🔴 Build Coolify | `g2wbydtk...:latest` | Dockerfile custom (ubuntu:22.04 + mise + opencode + OMO) |
| 4 | **opencode-native** | 🔴 Build Coolify | `rblvxrpir...:latest` | Mesmo Dockerfile do OMO, `OMO_MODE=native` |
| 5 | **devhost** | 🔴 Build Coolify | `e2068gphe...:latest` | Dockerfile custom (ubuntu:24.04 + dev tools + SSH) |
| 6 | **xkull-dashboard** | 🟡 nginx público | `nginx:alpine` | HTML em binds no Coolify, gerado por script externo |

## 🟢 Serviços SEM dependência (imagens de registry público)

| Serviço | Imagem |
|---------|--------|
| home-assistant | `ghcr.io/passoz/homeassistant:latest` |
| aluxen | `ghcr.io/passoz/aluxen:latest` |
| hermes | `ghcr.io/passoz/hermes:latest` |
| navidrome | `deluan/navidrome:latest` |
| odysseus | compose próprio em `/opt/odysseus/` |

---

## 🔴 1. evolucsia-site (wgt9jr1...)

### Repositório de origem
- **GitHub Actions:** `appleboy/scp-action` → `evolucsia.com:/home/ubuntu/vps/site`
- **Provável repo:** `github.com/passoz/evolucsia` (branch `main`)
- **Deploy original:** SCP para o VPS, Coolify builda imagem Docker

### Dockerfile reconstruído

```dockerfile
FROM nginx:alpine
# Base: alpine 3.23.4, nginx 1.31.1

WORKDIR /usr/share/nginx/html/

COPY . .

# nginx config customizada
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Limpeza de arquivos de build
RUN rm -f .env docker-compose.yaml Dockerfile nginx.conf

EXPOSE 80
```

### Conteúdo dentro da imagem
```
/usr/share/nginx/html/
├── index.html          # Landing page (~37KB)
├── styles.css          # Estilos (~20KB)
├── 50x.html
├── robots.txt
├── sitemap.xml
├── paleta-3-cores.json
├── assets/
│   ├── logo.png
│   └── cases/
│       ├── case-01.png .. case-06.png
└── strategy/
    ├── 01-positioning.md .. 06-realismo-comercial.md
    └── README.md
```

### Como recriar fora do Coolify
1. Clonar o repo (se tiver acesso): `git clone git@github.com:passoz/evolucsia.git`
2. Build: `docker build -t evolucsia-site .`
3. Ou usar a imagem já buildada: `wgt9jr1ildqyktaw045vb9xu:43afb126b97704d3f0698f5dcc51b262d80ed927`

---

## 🔴 2. paletto (va3k562...)

### Repositório de origem
- **GitHub Actions:** `appleboy/scp-action` → `evolucsia.com:/home/ubuntu/vps/paletto`
- **Canonical URL:** `https://passoz.github.io/paletto/`
- **Provável repo:** `github.com/passoz/paletto` (branch `main`)

### Dockerfile reconstruído

```dockerfile
FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

COPY . .
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

RUN rm -f .env docker-compose.yaml Dockerfile nginx.conf

EXPOSE 80
```

### Conteúdo dentro da imagem
```
/usr/share/nginx/html/
├── index.html   # Gerador de paletas
├── style.css
├── script.js
├── 50x.html
├── robots.txt
├── sitemap.xml
└── .github/workflows/deploy.yml
```

---

## 🔴 3 & 4. OpenCode OMO + Native (g2wbydtk..., rblvxrpir...)

### Origem
Imagens idênticas, diferem apenas no ARG `OMO_MODE`:
- **OMO:** `OMO_MODE=omo-full`
- **Native:** `OMO_MODE=native`

### Dockerfile reconstruído

```dockerfile
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV OPENCODE_SERVER_HOSTNAME=0.0.0.0
ENV MISE_YES=1
ENV PATH=/root/.local/bin:/root/.local/share/mise/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ARG OMO_MODE=omo-full
ARG OPENCODE_GH_TOKEN
ENV OMO_MODE=${OMO_MODE}

# Dependências
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git gh jq openssh-client tini \
    && rm -rf /var/lib/apt/lists/*

# Instalar mise (version manager)
RUN curl https://mise.jdx.dev/install.sh | HOME=/image-root sh

# Instalar OpenCode via mise
RUN HOME=/image-root \
    MISE_DATA_DIR=/image-root/.local/share/mise \
    MISE_CONFIG_DIR=/image-root/.config/mise \
    MISE_CACHE_DIR=/image-root/.cache/mise \
    PATH="/image-root/.local/bin:/image-root/.local/share/mise/shims:$PATH" \
    /image-root/.local/bin/mise use -g github:anomalyco/opencode

# Configurar OMO plugin
RUN mkdir -p /etc/opencode
RUN echo '{"sisyphus_agent":{"disabled":false,"default_builder_enabled":false,"planner_enabled":true,"replace_plan":false}}' \
    > /etc/opencode/oh-my-openagent.defaults.json

# Script de configuração OMO
COPY configure-opencode-omo /usr/local/bin/configure-opencode-omo
RUN chmod +x /usr/local/bin/configure-opencode-omo

WORKDIR /workspace
RUN mkdir -p /workspace

EXPOSE 4096 8080

CMD ["/usr/bin/tini", "--", "sh", "-c", "\
    if [ ! -x /root/.local/bin/mise ]; then cp -a /image-root/. /root/; fi; \
    export PATH=\"/root/.local/bin:/root/.local/share/mise/shims:$PATH\"; \
    eval \"$(/root/.local/bin/mise activate sh)\"; \
    /root/.local/bin/mise install; \
    mkdir -p /workspace /root/.config/gh; \
    chmod 0777 /workspace; \
    gh config set git_protocol ssh >/dev/null 2>&1 || true; \
    gh config set prompt disabled >/dev/null 2>&1 || true; \
    if [ -n \"${OPENCODE_GH_TOKEN:-}\" ]; then \
      printf \"github.com:\\n    oauth_token: %s\\n    git_protocol: ssh\\n    user: passoz\\n\" \"$OPENCODE_GH_TOKEN\" > /root/.config/gh/hosts.yml; \
      chmod 600 /root/.config/gh/hosts.yml; \
    fi; \
    /usr/local/bin/configure-opencode-omo; \
    opencode web --port 4096 --hostname 0.0.0.0 & \
    opencode serve --port 8080 --hostname 0.0.0.0 & \
    wait \
"]
```

### Observações
- ⚠️ O `OPENCODE_GH_TOKEN` está hardcoded no build ARG (vazou no docker history)
- A imagem tem o OpenCode pré-instalado em `/image-root/`
- No primeiro boot, o CMD copia `/image-root/` → `/root/` se mise não existir

---

## 🔴 5. devhost (e2068gphe...)

### Dockerfile reconstruído

```dockerfile
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ARG TAILSCALE_AUTHKEY
ENV TAILSCALE_AUTHKEY=${TAILSCALE_AUTHKEY}

# Pacotes essenciais
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl git wget unzip zip xz-utils ca-certificates build-essential \
    sudo vim nano less jq procps zsh iputils-ping net-tools dnsutils \
    openssh-client openssh-server rsync tmux htop tree ripgrep fd-find \
    fzf neovim gnupg lsb-release \
    && apt-get clean && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /run/sshd

# Tailscale
RUN curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.noarmor.gpg \
    | tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null \
    && curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/noble.tailscale-keyring.list \
    | tee /etc/apt/sources.list.d/tailscale.list \
    && apt-get update && apt-get install -y --no-install-recommends tailscale \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# GitHub CLI
RUN mkdir -p -m 755 /etc/apt/keyrings \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
       | tee /etc/apt/keyrings/githubcli-archive-keyring.gpg >/dev/null \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Usuário passoz com sudo
RUN useradd -m -s /bin/zsh passoz \
    && echo "passoz ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# mise (version manager)
RUN curl https://mise.run | sh \
    && cp /root/.local/bin/mise /usr/local/bin/mise \
    && chmod +x /usr/local/bin/mise

USER passoz
WORKDIR /home/passoz

# oh-my-zsh
RUN git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh \
    && cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc

# Plugins zsh
RUN git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git \
       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
    && git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git \
       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
    && sed -i "s/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/" ~/.zshrc

# mise config
RUN echo 'eval "$(mise activate zsh)"' >> ~/.zshrc \
    && echo 'eval "$(mise activate zsh)"' > ~/.zshenv

# Runtime tools
RUN mise use -g node@latest \
    && mise use -g go@latest \
    && mise use -g npm@latest \
    && mise reshim

# bash config
RUN echo 'eval "$(mise activate bash)"' >> ~/.bashrc

USER root
# SSH setup
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh \
    && sudo ssh-keygen -A

RUN ln -sf /home/passoz/.local/share/mise/shims/* /usr/local/bin/ 2>/dev/null || true

USER passoz
ENV SSH_PORT=22
ENV TAILSCALE_HOSTNAME=coolify-dev

EXPOSE 22

CMD ["sh", "-c", "\
    if [ -n \"$TAILSCALE_AUTHKEY\" ]; then \
      echo '[startup] subindo tailscaled...'; \
      sudo /usr/sbin/tailscaled --state=/var/lib/tailscale/tailscaled.state --socket=/var/run/tailscale/tailscaled.sock --tun=userspace-networking & \
      TAILSCALED_PID=$!; \
      for i in $(seq 1 30); do \
        sudo /usr/bin/tailscale status >/dev/null 2>&1 && break; \
        sleep 0.5; \
      done; \
      echo '[startup] tailscale up'; \
      sudo /usr/bin/tailscale up --authkey=\"$TAILSCALE_AUTHKEY\" --hostname=\"$TAILSCALE_HOSTNAME\" || true; \
    fi; \
    echo '[startup] iniciando sshd'; \
    exec sudo /usr/sbin/sshd -D -e -p \"$SSH_PORT\" \
"]
```

---

## 🟡 6. xkull-dashboard

### Status
Usa `nginx:alpine` (imagem pública) com conteúdo HTML montado via bind mounts.

### Conteúdo
O HTML está em `/data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/usr/share/nginx/html/`:
- `index.html` (~2.7KB) — página de índice
- `DD-MM-2026.html` (~5KB cada) — 14 arquivos de relatório diário

O conteúdo é gerado por um script externo (provavelmente cron job) que produz
os arquivos HTML diariamente.

### Como recriar
Não depende de Dockerfile do Coolify — basta garantir que o diretório de HTML
exista no host e montar no `nginx:alpine`.

---

## ⚠️ Tokens e Secrets Expostos

Durante a análise do `docker history`, foram encontrados secrets hardcoded:

| Serviço | Secret | Tipo |
|---------|--------|------|
| opencode-omo | `OPENCODE_GH_TOKEN` | GitHub PAT (classic) |
| opencode-native | `OPENCODE_GH_TOKEN` | GitHub PAT (classic) |
| devhost | `TAILSCALE_AUTHKEY` | Tailscale auth key |
| hermes | `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, `GH_TOKEN`, `AUTHORIZED_KEYS` | Vários |

> ⚠️ **Recomendação:** Rotacionar todos esses tokens. Eles estão visíveis no
> layer history das imagens Docker.

## 📋 Plano de Ação

### Imediato
1. Rotacionar tokens expostos (GH, Anthropic, Telegram, Tailscale)
2. Localizar/clonar repositórios `passoz/evolucsia` e `passoz/paletto` no GitHub
3. Fazer rebuild das imagens com os Dockerfiles reconstruídos acima

### Migração
4. Para cada serviço 🔴, fazer build local com `docker build`
5. Substituir a imagem do Coolify pela nova imagem no `docker-compose.yml`
6. Atualizar `docker-compose.yml` para usar rede `web` (Caddy)
