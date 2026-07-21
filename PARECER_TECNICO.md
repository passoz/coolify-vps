# Parecer Técnico: Diagnóstico e Plano de Ação (VPS us-amd-01)

> **Data da Análise:** 20 de Julho de 2026  
> **Status da Infraestrutura:** Transição gradual do Coolify para Docker Compose + Caddy.

---

## 1. Visão Geral do Repositório

O repositório `/home/passoz/dev/coolify-vps` centraliza as configurações de Docker Compose e Dockerfiles para gerenciar de forma independente os serviços hospedados na VPS da Oracle Cloud (`us-amd-01`).

A estratégia de migração do Coolify para Compose está bem delineada, focando em:
1. **Preservação de Dados:** Utilização de volumes externos pré-existentes (`external: true`) criados originalmente pelo Coolify.
2. **Gateway Centralizado:** Caddy substituindo o Traefik do Coolify, gerenciando certificados SSL de forma transparente e provendo controle de concorrência/rate limit.
3. **Rede Compartilhada (`web`):** Rede externa dedicada à comunicação interna entre o Caddy e os serviços sem expor portas desnecessárias ao host.

---

## 2. Diagnóstico de Riscos e Inconsistências

### ⚠️ Inconsistência nos Sites Estáticos (`paletto` e `evolucsia-site`)
Nos `Dockerfile` de `paletto/Dockerfile` e `evolucsia-site/Dockerfile`, a estrutura de build está utilizando:
```dockerfile
WORKDIR /usr/share/nginx/html/
COPY . .
RUN rm -f docker-compose.yaml Dockerfile nginx-site.conf .env
```
Como o código do site está localizado em subdiretórios `./html` em cada pasta, o comando `COPY . .` copia o diretório `html/` inteiro para dentro de `/usr/share/nginx/html/`, aninhando a pasta (`/usr/share/nginx/html/html/...`).
* **Sintoma:** O Nginx está configurado para ler diretamente de `/usr/share/nginx/html`. Ao tentar acessar os domínios `paletto.space` ou `evolucsia.com`, o Nginx retornará **404 Not Found** pois a raiz padrão estará vazia.
* **Resolução:** Corrigir a diretiva de cópia no `Dockerfile` de ambos os projetos para copiar apenas a pasta de arquivos estáticos, reduzindo o tamanho das camadas e eliminando a necessidade de remover arquivos na sequência:
  ```dockerfile
  FROM nginx:alpine
  COPY html/ /usr/share/nginx/html/
  COPY nginx-site.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  ```

### ⚠️ Acoplamento Físico de Caminhos no `xkull-dashboard`
O arquivo `xkull-dashboard/docker-compose.yml` monta os arquivos diretamente do diretório interno de builds do Coolify:
```yaml
volumes:
  - /data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/usr/share/nginx/html:/usr/share/nginx/html:ro
  - /data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/etc/nginx/conf.d/default.conf:/etc/nginx/conf.d/default.conf:ro
  - /data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/etc/nginx/.htpasswd:/etc/nginx/.htpasswd:ro
```
* **Risco:** No momento em que o Coolify for totalmente descontinuado e sua pasta `/data/coolify` for removida ou limpa, a aplicação `xkull-dashboard` deixará de funcionar imediatamente.
* **Resolução:** Copiar os arquivos estáticos de `/data/coolify/applications/j5uevdeapf06dyeotn1vnf6n/usr/share/nginx/html` e o arquivo `.htpasswd` para subpastas locais em `xkull-dashboard/` e referenciá-los relativamente no `docker-compose.yml`.

### 🚨 Exposição de Secrets no Histórico de Build do Docker
Conforme o documento `ANALISE_BUILDS.md` indicou, foram identificadas chaves expostas nos metadados de build (`docker history`) de contêineres gerenciados anteriormente:
* **Chaves Vazadas:** `OPENCODE_GH_TOKEN` (GitHub PAT), `TAILSCALE_AUTHKEY`, `ANTHROPIC_API_KEY`, `TELEGRAM_BOT_TOKEN`, e `GH_TOKEN`.
* **Recomendação Crítica:** Se ainda não o fez, **revogue e rotacione imediatamente** essas credenciais em suas respectivas plataformas. Em builds futuros, utilize arquivos `.env` ou segredos injetados em runtime para evitar vazamentos permanentes no histórico das imagens Docker.

---

## 3. Análise da Configuração das Stacks

1. **Caddy Gateway:** A customização do Caddy com o módulo `caddy-ratelimit` usando `xcaddy` no `Dockerfile` é excelente e garante proteção contra força bruta nas rotas do OpenCode.
2. **Home Assistant & Aluxen:** Estão utilizando perfeitamente o mapeamento de volumes persistentes legados com `external: true`, o que viabiliza um chaveamento rápido de contêineres sem perda de dados.
3. **Odysseus Stack:** Configuração ideal com separação de rede interna (`odysseus`) para banco e buscas vetoriais, mantendo apenas a API e o proxy do Odysseus na rede `web`.

---

## 4. Plano de Ação Recomendado

### Imediato (Correções e Segurança)
1. **Rotacionar tokens expostos** (GitHub, Anthropic, Telegram, Tailscale).
2. **Aplicar a correção dos Dockerfiles** de `paletto` e `evolucsia-site` (evitando a pasta `html/` aninhada).
3. **Migrar os arquivos do `xkull-dashboard`** da pasta do Coolify para o diretório local no repositório.

### Médio Prazo (Resiliência do Servidor)
4. **Habilitar Swap no Host:** O host (`us-amd-01`) não possui swap configurado. Crie um arquivo swap de 4 GB a 8 GB para evitar crashes repentinos por falta de memória (OOM).
5. **Configurar Firewall (UFW):** Garantir que apenas as portas 80, 443, 3322 (SSH do devhost) e a porta principal SSH do host (22) estejam expostas publicamente.
6. **Automação local:** Criar um `Makefile` na raiz para agilizar builds de imagens estáticas e deploys locais (`docker compose up -d`).
