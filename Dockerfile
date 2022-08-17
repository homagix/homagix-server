FROM node:16-alpine@sha256:2c405ed42fc0fd6aacbe5730042640450e5ec030bada7617beac88f742b6997b as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:2c405ed42fc0fd6aacbe5730042640450e5ec030bada7617beac88f742b6997b
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
