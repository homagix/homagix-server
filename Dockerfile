FROM node:16-alpine@sha256:4d68856f48be7c73cd83ba8af3b6bae98f4679e14d1ff49e164625ae8831533a as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:4d68856f48be7c73cd83ba8af3b6bae98f4679e14d1ff49e164625ae8831533a
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
