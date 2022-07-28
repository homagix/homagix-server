FROM node:16-alpine@sha256:aadb411a5d398d2141f36a61f469ab91b971e43988d6c74aa5204986e5fe18a1 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:aadb411a5d398d2141f36a61f469ab91b971e43988d6c74aa5204986e5fe18a1
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
