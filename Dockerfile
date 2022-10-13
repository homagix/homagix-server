FROM node:16-alpine@sha256:c23ebe44ddb93e89e753ff6a1a52a15495c3c7b7174c49b53a44a46ebc5c0caf as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:c23ebe44ddb93e89e753ff6a1a52a15495c3c7b7174c49b53a44a46ebc5c0caf
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
