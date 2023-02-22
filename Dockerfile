FROM node:16-alpine@sha256:029a85552a270cd6dfae0ec222465f1deacfaf7cee030981b7ff6acd6a0eaf33 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:029a85552a270cd6dfae0ec222465f1deacfaf7cee030981b7ff6acd6a0eaf33
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
