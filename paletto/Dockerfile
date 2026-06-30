# paletto — Site estático (gerador de paleta de cores)
# Repositório de origem: github.com/passoz/paletto (branch main)
FROM nginx:alpine

WORKDIR /usr/share/nginx/html/

COPY . .

# Config nginx - mesmo padrão do build original
COPY nginx-site.conf /etc/nginx/conf.d/default.conf

RUN rm -f docker-compose.yaml Dockerfile nginx-site.conf .env

EXPOSE 80
