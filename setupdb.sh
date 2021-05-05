if [ -z "$APP_DB_NAME" ]
then
  echo "APP_DB_NAME not set! Aborting db setup."
  exit 1
fi

if [ "$SPLEIS_DB_PORT" ]
then
  PORT=$SPLEIS_DB_PORT;
else
  PORT=5432; #default
fi

psql -p $PORT -c "SELECT pid, pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$APP_DB_NAME' AND pid <> pg_backend_pid();" \
&& psql -p $PORT -c "DROP DATABASE IF EXISTS $APP_DB_NAME;" \
&& psql -p $PORT -c "CREATE DATABASE $APP_DB_NAME;" \
