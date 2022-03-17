FROM node:16-alpine@sha256:2eafdff61134201bb13e452ae5515ac181126d28d91d548b048dab66140adbe6 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:2eafdff61134201bb13e452ae5515ac181126d28d91d548b048dab66140adbe6
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
