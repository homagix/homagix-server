FROM node:16-alpine@sha256:5d84cc2b21a259b379805e899f6e52b583c1bce400e53f65e38e71fefc87db17 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:5d84cc2b21a259b379805e899f6e52b583c1bce400e53f65e38e71fefc87db17
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
