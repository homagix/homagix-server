FROM node:16-alpine@sha256:7584b116f368d94fab2ecc21ebbcfd5434a3427c2f96f846972821b5ad0266fc as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:7584b116f368d94fab2ecc21ebbcfd5434a3427c2f96f846972821b5ad0266fc
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
