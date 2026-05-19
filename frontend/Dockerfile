FROM docker.io/library/node:21.6.1 AS build

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm config set fetch-retry-maxtimeout 6000000
RUN npm config set fetch-retry-mintimeout 1000000
RUN npm config set maxsockets 1
RUN npm config set cache /tmp/.npm

RUN NODE_OPTIONS="--max_old_space_size=4096" npm install --legacy-peer-deps --no-audit --no-fund

COPY . .
RUN GENERATE_SOURCEMAP=false NODE_OPTIONS="--max_old_space_size=1536" npm run build

FROM docker.io/library/nginx:1.27.0-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY --from=build /usr/src/app/nginx-custom.conf /etc/nginx/conf.d/default.conf
COPY --from=build /usr/src/app/.env.example /tmp/runtime-env/.env

RUN apk add --update nodejs
RUN apk add --update npm
RUN npm i -g runtime-env-cra

WORKDIR /usr/share/nginx/html
EXPOSE 3000

CMD ["/bin/sh", "-c", "runtime-env-cra --env-file /tmp/runtime-env/.env --config-name ./runtime-env.js && nginx -g \"daemon off;\""]
