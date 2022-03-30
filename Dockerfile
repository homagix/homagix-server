FROM node:16-alpine@sha256:32f64135e74ec4dc5d63cc36318444f1d801cd23c44253124f7eccb52c4b89c5 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:32f64135e74ec4dc5d63cc36318444f1d801cd23c44253124f7eccb52c4b89c5
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
