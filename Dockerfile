FROM node:16-alpine@sha256:1621ddffc775ccf10dc8710660e70d5bfb8e4ee349b926f133698e6512144b73 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:1621ddffc775ccf10dc8710660e70d5bfb8e4ee349b926f133698e6512144b73
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
