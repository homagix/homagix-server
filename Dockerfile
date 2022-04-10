FROM node:16-alpine@sha256:28bed508446db2ee028d08e76fb47b935defa26a84986ca050d2596ea67fd506 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:28bed508446db2ee028d08e76fb47b935defa26a84986ca050d2596ea67fd506
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
