FROM node:16-alpine@sha256:9ef5d0d3cdd256557cf829f2bf90d7963de7c128ef1a8ee24b49e69409392dec as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:9ef5d0d3cdd256557cf829f2bf90d7963de7c128ef1a8ee24b49e69409392dec
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
