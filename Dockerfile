FROM node:16-alpine@sha256:58e4dfcf063f67d71e608c3cace5a0bcf39e9dbab3047b41e20c15c7132d1d46 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:58e4dfcf063f67d71e608c3cace5a0bcf39e9dbab3047b41e20c15c7132d1d46
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
