FROM node:16-alpine@sha256:308e8c2ceed9182ac9f937ad166978eaab7d30ea2fe9202b24bf1fdaea34d431 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:308e8c2ceed9182ac9f937ad166978eaab7d30ea2fe9202b24bf1fdaea34d431
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
