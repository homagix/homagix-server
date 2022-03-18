FROM node:16-alpine@sha256:5cedfa34a58d27f1575497ecf826eb3b68b917cec75fbc921e43f701f33ecdfd as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:5cedfa34a58d27f1575497ecf826eb3b68b917cec75fbc921e43f701f33ecdfd
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
