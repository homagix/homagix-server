FROM node:16-alpine@sha256:66ad21bf5c87492a08f3e86e1e8a2778a78d1662fb6576c288b06fdd99935e12 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:66ad21bf5c87492a08f3e86e1e8a2778a78d1662fb6576c288b06fdd99935e12
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
