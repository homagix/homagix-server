FROM node:16-alpine@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
