FROM node:16-alpine@sha256:d00dbac92c6cf268fe35427366e1f091d27cd306dd95c65e307b4058bc8bf168 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:d00dbac92c6cf268fe35427366e1f091d27cd306dd95c65e307b4058bc8bf168
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
