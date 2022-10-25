FROM node:16-alpine@sha256:842770ef089fcb7c3bc40fcbf2b1f80fd2361558d4950f03f24444767265e613 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:842770ef089fcb7c3bc40fcbf2b1f80fd2361558d4950f03f24444767265e613
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
