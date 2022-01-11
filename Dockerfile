FROM node:16-alpine@sha256:67aba95725bee70776b376d21ce061a04be62bae215d51b1dbfd6621c0d4022d as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:67aba95725bee70776b376d21ce061a04be62bae215d51b1dbfd6621c0d4022d
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
