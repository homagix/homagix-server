FROM node:16-alpine@sha256:afa007fd9ed55e78a01998d79197c5f2d586b806ed031a595f4fbb25db03a607 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:afa007fd9ed55e78a01998d79197c5f2d586b806ed031a595f4fbb25db03a607
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
