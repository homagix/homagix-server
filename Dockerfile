FROM node:16-alpine@sha256:51542061b77f105c2db658035ac6070229f9ea1d3270ab78775df9a825d9a759 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:51542061b77f105c2db658035ac6070229f9ea1d3270ab78775df9a825d9a759
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
