FROM node:16-alpine@sha256:687867b9ea2903e81dd4b594c704c7a19c29b46938aa2b9a478ddb5e65e2abdf as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:687867b9ea2903e81dd4b594c704c7a19c29b46938aa2b9a478ddb5e65e2abdf
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
