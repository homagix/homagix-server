FROM node:16-alpine@sha256:b66869a9dc6bfeed416395c2a2f717bd1779af1cef828fe7941af3a8d0837fdc as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:b66869a9dc6bfeed416395c2a2f717bd1779af1cef828fe7941af3a8d0837fdc
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
