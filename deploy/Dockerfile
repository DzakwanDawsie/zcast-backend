FROM node:23-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci --omit=dev && \
    npm cache clean --force

FROM node:23-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

RUN addgroup -S zcast && adduser -S zcast -G zcast

COPY --from=builder /app/node_modules ./node_modules
COPY --chown=zcast:zcast . .

RUN mkdir -p public && chown zcast:zcast public

USER zcast

EXPOSE 8424

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8424/ || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
