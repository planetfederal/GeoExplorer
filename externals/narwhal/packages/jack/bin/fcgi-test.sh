#!/bin/sh

PORT=8080

if [ ! "$NARWHAL_PLATFORM" ]; then
	export NARWHAL_PLATFORM="k7"
fi

BIN=""
case "$1" in
	/*) # absolute path
		BIN="$1"
		;;
	*)
	    BIN=$(which $1)
	    ;;
esac

if [ ! "$BIN" ]; then
    BIN="$PWD/$1"
fi
shift

ARGS=""
while [ $# -gt 0 ]
do
	ARG=$1
	shift
	case $ARG in
		/*) # absolute path
			ARGS="$ARGS $ARG"
			;;
		*)
			if [ -f "$ARG" ]; then
				# convert file paths to absolute
				ARGS="$ARGS $PWD/$ARG"
			else
				# everything else
				ARGS="$ARGS $ARG"
			fi
			;;
	esac
done

BIN_PATH="$BIN $ARGS"
echo $BIN_PATH

TMP_CONFIG="/tmp/lighttpd-fcgi.conf"
cat > "$TMP_CONFIG" <<EOF

server.modules = (
	"mod_fastcgi",
)

server.document-root = "."
server.port = $PORT

fastcgi.debug = 1
fastcgi.server = (
	"" => ((
		"bin-path" => "$BIN_PATH",
		"min-procs" => 1,
		"max-procs" => 1,
		"socket" => "/tmp/lighttpd-fastcgi.sock",
		"check-local" => "disable"
	))
)
EOF

lighttpd -D -f "$TMP_CONFIG"
