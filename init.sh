#!/bin/bash

# Function to extract schemas from AsyncAPI YAML
extract_schemas() {
  asyncapi_file=$1
  # Extract schemas from the AsyncAPI YAML file
  schemas=$(yq e '.components.schemas' $asyncapi_file)
 echo "Extraction"
  echo "$schemas"
}

# Function to post schema to schema registry
post_schema_to_registry() {
  schema=$1
  schema_registry_url=$2
  subject=$3

  # Convert the schema to a JSON string and escape it
  escaped_schema=$(jq -Rs . <<<"$schema")

  curl -X POST \
    $schema_registry_url/subjects/$subject/versions \
    -H "Content-Type: application/vnd.schemaregistry.v1+json" \
    -d '{
      "schema": '"$escaped_schema"',
      "schemaType": "JSON"
    }'
}

# Main script
asyncapi_file="asyncapi.yaml"
schema_registry_url="http://localhost:8081"  # Schema Registry URL

echo "Extracting schemas from $asyncapi_file..."
schemas=$(extract_schemas $asyncapi_file)

if [ -z "$schemas" ]; then
  echo "No schemas found in $asyncapi_file."
  exit 1
fi

echo "Posting schemas to Schema Registry..."
subject="user-signedup"  # Example subject name
post_schema_to_registry "$schemas" "$schema_registry_url" "$subject"

echo "Schemas posted successfully."

