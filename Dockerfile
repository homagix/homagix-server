FROM node:16-alpine@sha256:296dd8ebd5b68706cc35d85e3c5b0103b28d2c0e8fde7e2feff68e4072636d6a as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:296dd8ebd5b68706cc35d85e3c5b0103b28d2c0e8fde7e2feff68e4072636d6a
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
