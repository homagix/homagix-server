FROM node:16-alpine@sha256:2ca257ee86a65e8d7fe6bb0ed3df2e7336b7c5a1662512627c99428beed8bdae as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:2ca257ee86a65e8d7fe6bb0ed3df2e7336b7c5a1662512627c99428beed8bdae
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
