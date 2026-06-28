FROM python:3.11-alpine

RUN addgroup -S runner && adduser -S runner -G runner

# Create sandbox dir with correct permissions
RUN mkdir -p /sandbox && chown runner:runner /sandbox

WORKDIR /sandbox

USER runner