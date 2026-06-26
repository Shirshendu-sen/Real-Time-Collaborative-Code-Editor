FROM golang:1.23-alpine

ENV GOCACHE=/tmp/go-cache
ENV GOPATH=/tmp/gopath

# Pre-compile the Go standard library so sandbox builds only compile user code
RUN mkdir -p /tmp/go-cache /tmp/gopath && go build std

RUN addgroup -S sandbox && adduser -S sandbox -G sandbox
RUN chown -R sandbox:sandbox /tmp/go-cache /tmp/gopath

WORKDIR /sandbox
RUN chown sandbox:sandbox /sandbox

USER sandbox
