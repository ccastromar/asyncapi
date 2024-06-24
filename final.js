const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');

async function extractSchemasAndPostToRegistry(inputFile, registryBaseUrl) {
    try {
        // Read AsyncAPI YAML file
        const yamlContent = fs.readFileSync(inputFile, 'utf8');
        const asyncApiObject = yaml.load(yamlContent);

        // Extract schemas from components
        const schemas = asyncApiObject.components.schemas;

        // Iterate over each schema and send it to schema registry
        for (const schemaName in schemas) {
            const schemaContent = schemas[schemaName];
            const registryUrl = `${registryBaseUrl}/subjects/${schemaName}-value/versions`;
            console.log(schemaContent); 
            // POST schema to registry
            const response = await axios.post(registryUrl, {
                schema: JSON.stringify(schemaContent)
            });

            console.log(`Schema '${schemaName}' posted to schema registry: ${response.status}`);
        }

        console.log(`All schemas extracted from '${inputFile}' and sent to schema registry '${registryBaseUrl}' successfully.`);
    } catch (error) {
        console.error('Error extracting schemas and posting to schema registry:', error.message);
    }
}

// Usage example: node extractAndPostSchemas.js input.yaml http://schema-registry-url:port
const [inputFile, registryBaseUrl] = process.argv.slice(2);
if (inputFile && registryBaseUrl) {
    extractSchemasAndPostToRegistry(inputFile, registryBaseUrl);
} else {
    console.error('Usage: node extractAndPostSchemas.js <inputFile.yaml> <registryBaseUrl>');
}

