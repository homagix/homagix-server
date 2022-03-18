FROM node:16-alpine@sha256:0f1c0144c4302b06891beb4096f7baf59cbdfbad8d3f604d1cb96b0338e63e0d as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:0f1c0144c4302b06891beb4096f7baf59cbdfbad8d3f604d1cb96b0338e63e0d
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
