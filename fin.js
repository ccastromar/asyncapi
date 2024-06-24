const fs = require('fs');
const axios = require('axios');
const yaml = require('js-yaml');

async function sendSchemasToRegistry(inputFile, registryBaseUrl) {
    try {
        // Read AsyncAPI YAML file
        const yamlContent = fs.readFileSync(inputFile, 'utf8');
        const asyncApiObject = yaml.load(yamlContent);

        // Extract schemas from components
        const schemas = asyncApiObject.components.schemas;

        // Separate schemas into two arrays: with and without $ref
        const schemasWithoutRef = [];
        const schemasWithRef = [];

        Object.keys(schemas).forEach(schemaName => {
            const schemaContent = schemas[schemaName];
            if (containsRef(schemaContent)) {
                schemasWithRef.push({ name: schemaName, content: schemaContent });
            } else {
                schemasWithoutRef.push({ name: schemaName, content: schemaContent });
            }
        });

        // Post schemas without $ref first
        await postSchemas(registryBaseUrl, schemasWithoutRef);

        // Then post schemas with $ref
        await postSchemas(registryBaseUrl, schemasWithRef);

        console.log(`All schemas from '${inputFile}' sent to schema registry '${registryBaseUrl}' successfully.`);
    } catch (error) {
        console.error('Error sending schemas to schema registry:', error.message);
    }
}

function containsRef(schemaContent) {
    // Check if schema content contains any $ref
    if (typeof schemaContent === 'object') {
        if ('$ref' in schemaContent) {
            return true;
        }
        for (const key in schemaContent) {
            if (containsRef(schemaContent[key])) {
                return true;
            }
        }
    }
    return false;
}

async function postSchemas(registryBaseUrl, schemas) {
    for (const schema of schemas) {
        const { name, content } = schema;
        const registryUrl = `${registryBaseUrl}/subjects/${name}/versions`;

        // POST schema to registry
        try {
            const response = await axios.post(registryUrl, {
                schema: JSON.stringify(content),
                schemaType: 'JSON',
                compatibility: 'BACKWARD'
            });
            console.log(`Schema '${name}' posted to schema registry: ${response.status}`);
         } catch (error) {
            if (error.response && error.response.status === 422) {
                console.error(`Error posting schema '${name}' to schema registry:`, error.response.data);
            } else {
                console.error(`Error posting schema '${name}' to schema registry:`, error.message);
            }
        }
    }
}

// Usage example: node sendSchemasToRegistry.js input.yaml http://schema-registry-url:port
const [inputFile, registryBaseUrl] = process.argv.slice(2);
if (inputFile && registryBaseUrl) {
    sendSchemasToRegistry(inputFile, registryBaseUrl);
} else {
    console.error('Usage: node sendSchemasToRegistry.js <inputFile.yaml> <registryBaseUrl>');
}

