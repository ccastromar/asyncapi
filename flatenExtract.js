const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');

// Load AsyncAPI YAML file
const asyncapiYaml = fs.readFileSync('asyncapi.yaml', 'utf8');
const asyncapi = yaml.load(asyncapiYaml);

// Mock Schema Registry endpoint URL
const schemaRegistryUrl = 'http://localhost:8081'; // Replace with your Schema Registry URL

// Function to resolve $ref in AsyncAPI specification
function resolveReferences(asyncapiSpec) {
  const resolvedSpec = JSON.parse(JSON.stringify(asyncapiSpec)); // Deep clone to avoid modifying original object

  function resolveRef(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(resolveRef);
    }

    if ('$ref' in obj) {
      const refPath = obj.$ref.replace(/^#/, '').split('/').filter(part => part !== '');
      let ref = resolvedSpec;
      refPath.forEach(part => {
        if (part in ref) {
          ref = ref[part];
        } else {
          throw new Error(`Invalid $ref: ${obj.$ref}`);
        }
      });
      return resolveRef(ref);
    }

    Object.keys(obj).forEach(key => {
      obj[key] = resolveRef(obj[key]);
    });

    return obj;
  }

  resolveRef(resolvedSpec);
  return resolvedSpec;
}

// Function to post schema to Schema Registry
async function postSchemaToRegistry(schema, subject) {
  console.log("Requested",schema);
  try {
    const response = await axios.post(
      `${schemaRegistryUrl}/subjects/${subject}/versions`,
      {
        schema: JSON.stringify(schema),
        schemaType: 'JSON', 
        compatibility: 'BACKWARD' 
      },
      {
        headers: {
          'Content-Type': 'application/vnd.schemaregistry.v1+json',
        },
      }
    );
    console.log(`Schema posted successfully for subject '${subject}'. Response:`, response.data);
  } catch (error) {
    console.error(`Error posting schema for subject '${subject}':`, error.response ? error.response.data : error.message);
  }
}

// Main function
async function main() {
  try {
    const resolvedAsyncapi = resolveReferences(asyncapi);

    // Extract schemas from resolved AsyncAPI specification
    const schemas = resolvedAsyncapi.components.schemas;

    // Post each schema to the Schema Registry
    for (const schemaName in schemas) {
      const schema = schemas[schemaName];
      const subject = schemaName.toLowerCase(); // Example: Use schema name as subject
      //await postSchemaToRegistry(schema, subject);

      const outputDir = 'output';
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
           fs.mkdirSync(outputDir, { recursive: true });
      }

      const schemaContent = schemas[schemaName];
      const outputFileName = `output/${schemaName}.json`;
      fs.writeFileSync(outputFileName, JSON.stringify(schemaContent, null, 2));
      console.log(`Schema '${schemaName}' extracted and saved to '${outputFileName}'`);
    }

    console.log('All schemas posted successfully to Schema Registry.');
  } catch (error) {
    console.error('Error processing AsyncAPI specification:', error);
  }
}

// Run the main function
main().catch(console.error);

