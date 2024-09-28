FROM node:18-alpine

RUN apk add --update --no-cache \
    make \
    g++ \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    libtool \
    autoconf \
    automake

WORKDIR /usr/src/app
COPY package.json yarn.lock ./
RUN yarn install
COPY . .

LABEL org.opencontainers.image.source=https://github.com/notlet/bridge
LABEL org.opencontainers.image.description="discord to hypixel guild chat bridge bot"
LABEL org.opencontainers.image.licenses=MIT

ENTRYPOINT [ "yarn", "start" ]