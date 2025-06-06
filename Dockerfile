# Builder
FROM docker.io/oven/bun:latest AS builder
WORKDIR /build/

ARG GIT_COMMIT
ENV NODE_ENV=production
ENV PORT=4000

COPY . ./

RUN bun install --production --frozen-lockfile --ignore-scripts
RUN bun run build:standalone

# Runner
FROM gcr.io/distroless/base-nossl-debian12:nonroot AS runner

ARG GIT_COMMIT
ENV GIT_COMMIT=$GIT_COMMIT
ENV PORT=4000

COPY --from=builder /build/dist/backend ./
COPY --from=builder /build/public ./public

EXPOSE 4000/tcp

CMD ["./backend"]
