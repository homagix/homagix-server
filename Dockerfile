FROM node:16-alpine@sha256:e2423ec956aaee105fd85084c9e5cbbfbc49339a79aaa95b6568e16b3ed6efb3 as builder
WORKDIR /build
ADD . .
RUN npm ci && \
    npm run build && \
    rm -rf node_modules && \
    npm ci --production
RUN mkdir /app && \
    mv build/* /app && \
    mv node_modules package.json /app


FROM node:16-alpine@sha256:e2423ec956aaee105fd85084c9e5cbbfbc49339a79aaa95b6568e16b3ed6efb3
ENV NODE_ENV production
WORKDIR /app
COPY --from=builder /app .
RUN chown -R node.node .
USER node


EXPOSE 8200
ENV NODE_ENV production
ENV BASEDIR /app
CMD node server.js
