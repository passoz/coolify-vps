# evolucsia-site — Site estático
# Repositório de origem: github.com/passoz/evolucsia (branch main)
FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

COPY . .

# Config nginx customizada (do build original)
COPY nginx-site.conf /etc/nginx/conf.d/default.conf

# Remove arquivos de build que não devem ir pra imagem
RUN rm -f docker-compose.yaml Dockerfile nginx-site.conf .env

EXPOSE 80
