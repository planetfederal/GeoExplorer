#!/bin/sh

# invokes a CGI application

export SCRIPT_NAME=""
export PATH_INFO="/"

export REQUEST_METHOD="GET"
export SERVER_NAME="localhost"
export SERVER_PORT="80"
export QUERY_STRING=""
export SERVER_PROTOCOL="HTTP/1.1"

export REMOTE_HOST="127.0.0.1"

echo "Host: localhost" | $1
