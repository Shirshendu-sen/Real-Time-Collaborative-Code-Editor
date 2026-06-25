FROM rust:1.83-alpine

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox

WORKDIR /sandbox
RUN chown sandbox:sandbox /sandbox

USER sandbox