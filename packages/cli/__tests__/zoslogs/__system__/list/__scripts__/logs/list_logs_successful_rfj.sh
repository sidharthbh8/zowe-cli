#!/bin/bash
set -e

zowe zos-logs list logs --rfj
exit $?
