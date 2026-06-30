# DevHost — Ambiente de Desenvolvimento SSH + Tailscale
# Imagem atual: e2068gphegei3by0ny5v7uft:latest
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
ARG TAILSCALE_AUTHKEY
ENV TAILSCALE_AUTHKEY=${TAILSCALE_AUTHKEY}
ENV SSH_PORT=22
ENV TAILSCALE_HOSTNAME=coolify-dev

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
    && chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
       > /etc/apt/sources.list.d/github-cli.list \
    && apt-get update && apt-get install -y --no-install-recommends gh \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Usuário passoz
RUN useradd -m -s /bin/zsh passoz \
    && echo "passoz ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# mise
RUN curl https://mise.run | sh \
    && cp /root/.local/bin/mise /usr/local/bin/mise \
    && chmod +x /usr/local/bin/mise

USER passoz
WORKDIR /home/passoz

# oh-my-zsh + plugins
RUN git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git ~/.oh-my-zsh \
    && cp ~/.oh-my-zsh/templates/zshrc.zsh-template ~/.zshrc \
    && git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions.git \
       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions \
    && git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git \
       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
    && sed -i 's/plugins=(git)/plugins=(git zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc

RUN echo 'eval "$(mise activate zsh)"' >> ~/.zshrc \
    && echo 'eval "$(mise activate zsh)"' > ~/.zshenv \
    && echo 'eval "$(mise activate bash)"' >> ~/.bashrc

RUN mise use -g node@latest \
    && mise use -g go@latest \
    && mise use -g npm@latest \
    && mise reshim

USER root
RUN mkdir -p ~/.ssh && chmod 700 ~/.ssh && ssh-keygen -A
RUN ln -sf /home/passoz/.local/share/mise/shims/* /usr/local/bin/ 2>/dev/null || true

USER passoz
EXPOSE 22

CMD ["sh", "-c", "\
    if [ -n \"$TAILSCALE_AUTHKEY\" ]; then \
      echo '[startup] tailscaled...'; \
      sudo /usr/sbin/tailscaled --state=/var/lib/tailscale/tailscaled.state \
        --socket=/var/run/tailscale/tailscaled.sock --tun=userspace-networking & \
      for i in $(seq 1 30); do \
        sudo /usr/bin/tailscale status >/dev/null 2>&1 && break; \
        sleep 0.5; \
      done; \
      sudo /usr/bin/tailscale up --authkey=\"$TAILSCALE_AUTHKEY\" \
        --hostname=\"$TAILSCALE_HOSTNAME\" || true; \
    fi; \
    echo '[startup] sshd na porta '$SSH_PORT; \
    exec sudo /usr/sbin/sshd -D -e -p \"$SSH_PORT\" \
"]
