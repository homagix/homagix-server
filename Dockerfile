FROM node:16-alpine@sha256:1c8769a8c9ed57817ef07162744a3722421333a438185c560aa42a9a1fc6ea23 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:1c8769a8c9ed57817ef07162744a3722421333a438185c560aa42a9a1fc6ea23
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
