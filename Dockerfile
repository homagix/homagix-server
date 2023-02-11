FROM node:16-alpine@sha256:04dda0a1e090395aa37d299896880944fdb6c57cc2d4cc9e05271133e1771640 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:04dda0a1e090395aa37d299896880944fdb6c57cc2d4cc9e05271133e1771640
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
