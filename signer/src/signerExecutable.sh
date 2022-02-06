#!/bin/sh
basedir=$(dirname "$(echo "$0" | sed -e 's,\\,/,g')")

case `uname` in
    *CYGWIN*) basedir=`cygpath -w "$basedir"`;;
esac

echo $basedir
if [ -x "$basedir/node" ]; then
  exec "$basedir/node"  "$basedir/signer.js" "$@"
else
  exec node  "$basedir/signer.js" "$@"
fi
