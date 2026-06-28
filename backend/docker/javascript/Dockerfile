FROM node:20-alpine

RUN addgroup -S runner && adduser -S runner -G runner

RUN mkdir -p /sandbox && chown runner:runner /sandbox

WORKDIR /sandbox

USER runner