FROM node:16-alpine@sha256:8b339a4ff4d9e83c064d88d53a76323b914dabace0daf4c794b69712ba487253 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:8b339a4ff4d9e83c064d88d53a76323b914dabace0daf4c794b69712ba487253
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
