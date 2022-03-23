FROM node:16-alpine@sha256:e1c1cdbde9e6ec33399c874fbf40135d0ed493daf7e819e2365909cbd290aee0 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:e1c1cdbde9e6ec33399c874fbf40135d0ed493daf7e819e2365909cbd290aee0
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
