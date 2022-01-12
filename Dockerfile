FROM node:16-alpine@sha256:03c17c77dfa5d8e8ac56eccdc536c9efae4227ccebc22476c1f8c7db09232b0a as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:03c17c77dfa5d8e8ac56eccdc536c9efae4227ccebc22476c1f8c7db09232b0a
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
