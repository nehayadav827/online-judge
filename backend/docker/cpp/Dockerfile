FROM alpine:3.19

RUN apk add --no-cache g++ libc-dev

RUN addgroup -S runner && adduser -S runner -G runner

RUN mkdir -p /sandbox && chown runner:runner /sandbox

WORKDIR /sandbox

USER runner