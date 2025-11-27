#!/bin/sh
set -e

DRIVER_JAR=/liquibase/drivers/mysql-connector-java-8.0.30.jar
CHANGELOG_DIR=/liquibase/changelog
JAR_URL="https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar"

if [ ! -f "$DRIVER_JAR" ]; then
  echo "JDBC driver not found at $DRIVER_JAR"
  echo "Attempting to download MySQL connector from Maven Central..."
  mkdir -p "$(dirname "$DRIVER_JAR")"
  if command -v curl >/dev/null 2>&1; then
    curl -fSL "$JAR_URL" -o "$DRIVER_JAR" || {
      echo "curl download failed" >&2
      echo "Please place the MySQL connector jar in database/liquibase/drivers and restart." >&2
      exit 1
    }
  elif command -v wget >/dev/null 2>&1; then
    wget -O "$DRIVER_JAR" "$JAR_URL" || {
      echo "wget download failed" >&2
      echo "Please place the MySQL connector jar in database/liquibase/drivers and restart." >&2
      exit 1
    }
  else
    echo "No curl or wget available in container; cannot auto-download JDBC driver." >&2
    echo "Place the MySQL connector jar in database/liquibase/drivers and restart." >&2
    exit 1
  fi
  echo "Downloaded JDBC driver to $DRIVER_JAR"
fi

cd "$CHANGELOG_DIR"

echo "Running Liquibase against jdbc:mysql://mysql:3306/reservation_db"
exec liquibase --classpath="$DRIVER_JAR" --changeLogFile=changelog.xml --searchPath=/liquibase/changelog --url=jdbc:mysql://mysql:3306/reservation_db --username=root --password= update
