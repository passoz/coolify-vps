# OpenCode — Ambiente de desenvolvimento com mise + OpenCode + OMO
# Imagem atual: g2wbydtk0e5pm8ogd41xhbjf:latest (opencode-omo)
#                rblvxrpir3b3ydpxi7qg1czh:latest (opencode-native)
#
# Build:
#   Para OMO:  docker build --build-arg OMO_MODE=omo-full -t opencode-omo .
#   Para Native: docker build --build-arg OMO_MODE=native -t opencode-native .
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV OPENCODE_SERVER_HOSTNAME=0.0.0.0
ENV MISE_YES=1
ENV OMO_MODE=omo-full
ENV PATH=/root/.local/bin:/root/.local/share/mise/shims:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

ARG OPENCODE_GH_TOKEN

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git gh jq openssh-client tini \
    && rm -rf /var/lib/apt/lists/*

RUN curl https://mise.jdx.dev/install.sh | HOME=/image-root sh

RUN HOME=/image-root \
    MISE_DATA_DIR=/image-root/.local/share/mise \
    MISE_CONFIG_DIR=/image-root/.config/mise \
    MISE_CACHE_DIR=/image-root/.cache/mise \
    PATH="/image-root/.local/bin:/image-root/.local/share/mise/shims:$PATH" \
    /image-root/.local/bin/mise use -g github:anomalyco/opencode

RUN mkdir -p /etc/opencode
RUN echo '{"sisyphus_agent":{"disabled":false,"default_builder_enabled":false,"planner_enabled":true,"replace_plan":false}}' \
    > /etc/opencode/oh-my-openagent.defaults.json

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
    if [ -n \"${OPENCODE_GH_TOKEN:-}\" ]; then \
      printf \"github.com:\\n    oauth_token: %s\\n    git_protocol: ssh\\n    user: passoz\\n\" \"$OPENCODE_GH_TOKEN\" > /root/.config/gh/hosts.yml; \
      chmod 600 /root/.config/gh/hosts.yml; \
    fi; \
    /usr/local/bin/configure-opencode-omo; \
    opencode web --port 4096 --hostname 0.0.0.0 & \
    opencode serve --port 8080 --hostname 0.0.0.0 & \
    wait \
"]
