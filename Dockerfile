FROM node:16-alpine@sha256:0a997e0acb61ec89bb4d78e97aca3cd4ccd7f75c3a3985ffee7e7e09434ab1e7 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:0a997e0acb61ec89bb4d78e97aca3cd4ccd7f75c3a3985ffee7e7e09434ab1e7
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
