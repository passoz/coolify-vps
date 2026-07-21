# Manual de Operação e Referência da Infraestrutura (VPS us-amd-01)

> **Versão:** 1.0  
> **Data:** 20/07/2026  
> **Status:** Ativo  
> **Autor:** Antigravity (AI Coding Assistant)  
> **Descrição:** Documento de referência operacional para a infraestrutura Docker Compose + Caddy migrada do Coolify na VPS Oracle Cloud `us-amd-01`.

---

## Controle de Versões (Changelog)

| Versão | Data | Autor | Descrição das Alterações |
| :--- | :--- | :--- | :--- |
| **1.1** | 20/07/2026 | Antigravity | Adição do serviço global `ntfy` integrado ao Caddy. |
| **1.0** | 20/07/2026 | Antigravity | Versão inicial consolidada reunindo levantamento, análise de builds e plano de ação. |

---

## 1. Visão Geral da Infraestrutura

O servidor principal **us-amd-01** (`vps.elf-platy.ts.net`) é hospedado na Oracle Cloud (OCI) sob a arquitetura **ARM64**. O acesso público direto é restrito, e a administração de rede e roteamento seguro é feita via **Tailscale**.

### Especificações do Host
* **S.O.:** Ubuntu 24.04.2 LTS (Noble Numbat)
* **Kernel:** 6.17.0-1010-oracle (ARM64)
* **Hardware:** 4 vCPUs (ARM64) | 23 GiB RAM | 200 GB SSD (113 GB livres atualmente)
* **Tailscale IP:** `100.79.151.31`
* **Rede Interna Docker Principal:** `web` (Driver: bridge, criada de forma externa)

---

## 2. Inventário e Mapeamento de Serviços

A tabela abaixo descreve todos os serviços declarados neste repositório, seus domínios públicos, as portas internas e a localização/estratégia de seus volumes.

| Serviço | Subdomínio (`evolucsia.com`) | Porta Interna | Volumes Reais (No Host) | Tipo de Imagem |
| :--- | :--- | :--- | :--- | :--- |
| **Caddy** | *Gateway* | `80/tcp`, `443/tcp` | `caddy-data`, `caddy-config` | Build local (com rate limit) |
| **Home Assistant** | `ha` | `8123` | `l4pr3k22aqb1o20nqto1cwrg-ha-config` (ext) | `ghcr.io/passoz/homeassistant` |
| **Aluxen** | `aluxen` | `3000` | `b35ezft6m5fdtxn7sotu7gfk-aluxen-data` (ext) | `ghcr.io/passoz/aluxen` |
| **Evolucsia Site** | `www` (e raiz) | `80` | Conteúdo na imagem (estático) | Build local (`Dockerfile`) |
| **Paletto** | `paletto.space` (raiz) | `80` | Conteúdo na imagem (estático) | Build local (`Dockerfile`) |
| **xkull Dashboard** | `xkull` | `80` | Bind mounts do Coolify (precisa desacoplar) | `nginx:alpine` |
| **OpenCode OMO** | `omoweb` | `4096`, `8080` | `opencode-omo-root`, `opencode-omo-workspace` | Build local (`OMO_MODE=omo-full`) |
| **OpenCode Native** | `ocweb` | `4096`, `8080` | `opencode-root`, `opencode-workspace` | Build local (`OMO_MODE=native`) |
| **Odysseus Stack** | `odysseus` | `7000` | Local em `/opt/odysseus/` + 4 volumes nomeados | Imagem local/pública |
| **DevHost** | `coolify-dev` (Tailnet) | `22` (SSHD) | `devhost-home`, `devhost-ssh`, `devhost-tailscale` | Build local (Ubuntu 24.04) |
| **Navidrome** | `media` | `4533` | Binds: `/home/ubuntu/navidrome-media`, `/data/coolify/services/dopv100qpem5f8urzah1dfo3/data` | `deluan/navidrome` |
| **ntfy** | `ntfy` | `80` | `ntfy-cache`, `ntfy-config` | `binwiederhier/ntfy:latest` |
| **WebPI** | `webpi` | `3000` | Sem volumes declarados | `ghcr.io/passoz/webpi` |
| **Syncthing** | (GUI apenas via Tailnet) | `8384` | `syncthing-config`, `syncthing-data` | `syncthing/syncthing` |

---

## 3. Guia de Correções Rápidas (Bugs Encontrados)

Estes problemas **não estavam mapeados** na documentação anterior do repositório e foram diagnosticados durante a varredura inicial:

### 3.1 Resolvendo o Bug do Nginx 404 em `paletto` e `evolucsia-site`
Os Dockerfiles originais copiam o repositório inteiro (`COPY . .`), criando uma pasta aninhada `/usr/share/nginx/html/html/index.html`. O Nginx, buscando os arquivos na raiz (`/usr/share/nginx/html/`), responde com erro `404`.

**Como Corrigir:**
Altere os arquivos `paletto/Dockerfile` e `evolucsia-site/Dockerfile` para utilizar a cópia limpa:

```dockerfile
FROM nginx:alpine
# Copia apenas o conteúdo da pasta html
COPY html/ /usr/share/nginx/html/
# Copia a configuração específica do Nginx
COPY nginx-site.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```
*Após alterar o Dockerfile, execute o build e reinicie o contêiner:*
```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

### 3.2 Desacoplando o `xkull-dashboard` do Coolify
O compose atual aponta para o diretório interno do Coolify. Para remover a dependência física:

1. Acesse o servidor e crie um diretório de arquivos locais no repositório:
   ```bash
   cd /home/passoz/dev/coolify-vps/xkull-dashboard
   mkdir -p html conf
   ```
2. Copie os arquivos existentes do Coolify para a nova estrutura local:
   ```bash
   cp -r /data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/usr/share/nginx/html/* ./html/
   cp /data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/etc/nginx/.htpasswd ./conf/
   ```
3. Atualize o `xkull-dashboard/docker-compose.yml` para usar os volumes locais relativos:
   ```yaml
   services:
     xkull-dashboard:
       image: nginx:alpine
       container_name: xkull-dashboard
       restart: unless-stopped
       volumes:
         - ./html:/usr/share/nginx/html:ro
         - ./default.conf:/etc/nginx/conf.d/default.conf:ro
         - ./conf/.htpasswd:/etc/nginx/.htpasswd:ro
       networks:
         - web
   ```
4. Suba o serviço atualizado:
   ```bash
   docker compose up -d --force-recreate
   ```

### 3.3 Mitigação de Segredos Vazados
Diversos tokens e segredos (como chaves da Anthropic e tokens de API do Telegram e do GitHub) ficaram registrados no histórico do Docker (`docker history`). 
* **Ação Obrigatória:** Rotacione todas as chaves sensíveis que estiveram ativas nesses ambientes.
* **Boa Prática:** Certifique-se de que nenhum segredo seja injetado via diretiva `ARG` em tempo de build, a menos que as chaves sejam descartáveis. Sempre utilize variáveis de ambiente (`environment` ou arquivos `.env` não versionados) em tempo de execução.

---

## 4. Procedimentos Operacionais Padrão (SOP)

### 4.1 Inicializando/Reiniciando o Caddy (Gateway)
O Caddy utiliza a imagem buildada localmente com suporte ao módulo `ratelimit`.

* **Reiniciar Caddy / Aplicar novo Caddyfile sem downtime:**
  ```bash
  cd /home/passoz/dev/coolify-vps/caddy
  docker compose exec -w /etc/caddy caddy caddy reload
  ```
* **Verificar logs em tempo real (essencial para debugar erros de SSL ou rotas):**
  ```bash
  docker compose logs -f --tail=100
  ```

### 4.2 Migrando um Serviço do Coolify para o Compose
1. **Identifique os volumes e a imagem do serviço no Coolify** (`docker inspect <nome-container>`).
2. **Pare e remova o contêiner do Coolify** (evitando conflito de portas e de montagem de volume):
   ```bash
   docker stop <container-coolify>
   docker rm <container-coolify>
   ```
3. **Crie/Valide a pasta do serviço no repositório** com o arquivo `docker-compose.yml` correto (definindo os volumes existentes como `external: true`).
4. **Adicione a rota correspondente no `caddy/Caddyfile`** e recarregue o Caddy (`caddy reload`).
5. **Suba o contêiner via docker compose**:
   ```bash
   cd /home/passoz/dev/coolify-vps/<servico>
   docker compose up -d
   ```

---

## 5. Resiliência do Servidor (Recomendações de Infraestrutura)

### 5.1 Adicionando Memória Swap no Host (Evitar OOM)
O servidor possui 23 GB de RAM física, porém **0 swap**. Se a memória física esgotar devido a picos das instâncias do OpenCode ou da stack Odysseus, o sistema operacional irá derrubar contêineres arbitrariamente.

**Como configurar 8GB de Swap:**
```bash
# 1. Cria o arquivo de swap
sudo fallocate -l 8G /swapfile

# 2. Define as permissões corretas
sudo chmod 600 /swapfile

# 3. Formata como swap
sudo mkswap /swapfile

# 4. Ativa o swap
sudo swapon /swapfile

# 5. Torna a alteração persistente adicionando ao fstab
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 6. Ajusta o nível de swappiness (prioriza RAM antes de usar swap)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### 5.2 Configuração do Firewall (UFW)
A segurança atual depende inteiramente das regras de entrada da Oracle Cloud (VCN). Para obter uma segunda camada de defesa no próprio host:

1. **Instale e ative o UFW**:
   ```bash
   sudo apt-get update && sudo apt-get install -y ufw
   ```
2. **Configure as políticas padrão**:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```
3. **Permita tráfego essencial**:
   ```bash
   # SSH Principal do Host
   sudo ufw allow 22/tcp comment 'SSH Host'
   
   # DevHost SSH
   sudo ufw allow 3322/tcp comment 'DevHost SSH Container'
   
   # HTTP/HTTPS para o Caddy Gateway
   sudo ufw allow 80/tcp comment 'HTTP Caddy'
   sudo ufw allow 443/tcp comment 'HTTPS Caddy'
   ```
4. **Ative o Firewall**:
   ```bash
   sudo ufw enable
   ```
5. **Verifique o status**:
   ```bash
   sudo ufw status verbose
   ```

---

## 6. Políticas de Backup e Recuperação

### 6.1 Backup das Configurações (`coolify-vps`)
Todo o estado de configuração da infraestrutura de contêineres está neste repositório. Faça commits frequentes e envie para o repositório remoto:
```bash
git add .
git commit -m "chore: ajuste de configuração operacional"
git push origin main
```

### 6.2 Backup dos Volumes de Dados (Exemplo com HA e Aluxen)
Os dados persistentes estão nos volumes do Docker. Para realizar o backup de segurança dos dados mais críticos:

```bash
# Criar diretório de backups
mkdir -p /home/ubuntu/backups

# Exemplo de backup de volume compactado (Home Assistant)
docker run --rm -v l4pr3k22aqb1o20nqto1cwrg-ha-config:/volume -v /home/ubuntu/backups:/backup alpine \
  tar -czf /backup/ha-config-backup-$(date +%F).tar.gz -C /volume .
```
