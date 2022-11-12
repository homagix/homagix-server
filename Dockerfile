FROM node:16-alpine@sha256:b9e3244a692a1e4fea97938e073a6563ebd88b88cb0c033bf9719c2bc1e79b58 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:b9e3244a692a1e4fea97938e073a6563ebd88b88cb0c033bf9719c2bc1e79b58
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
