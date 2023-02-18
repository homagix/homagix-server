FROM node:16-alpine@sha256:0fcf4fb718a763fa53ac8d60073a7cd7dc1520076e08ea0180591174122e52f3 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:0fcf4fb718a763fa53ac8d60073a7cd7dc1520076e08ea0180591174122e52f3
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
