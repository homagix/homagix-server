FROM node:16-alpine@sha256:f94079d73e46f76a250240f4d943f87998123d4b89b38a21407f1bdfa7b3e750 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:f94079d73e46f76a250240f4d943f87998123d4b89b38a21407f1bdfa7b3e750
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
