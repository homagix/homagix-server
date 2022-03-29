FROM node:16-alpine@sha256:9caa35be1c0dc66010ad6358830f33f4fd5fda5119fed06b99b03ede38a55452 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:9caa35be1c0dc66010ad6358830f33f4fd5fda5119fed06b99b03ede38a55452
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
