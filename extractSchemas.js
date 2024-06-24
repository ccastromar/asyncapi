const fs = require('fs');
const yaml = require('js-yaml');
const RefParser = require('json-schema-ref-parser');
const axios = require('axios');

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

async function extractSchemas(inputFile, outputFile) {
    try {
        // Read AsyncAPI YAML file
        const yamlContent = fs.readFileSync(inputFile, 'utf8');
        const asyncApiObject = yaml.load(yamlContent);

        // Extract schemas from components
        const schemas = asyncApiObject.components.schemas;

        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Iterate over each schema and write it to a separate JSON file
        Object.keys(schemas).forEach(schemaName => {
            const schemaContent = schemas[schemaName];
            const outputFileName = `${outputDir}/${schemaName}.json`;
            fs.writeFileSync(outputFileName, JSON.stringify(schemaContent, null, 2));
            console.log(`Schema '${schemaName}' extracted and saved to '${outputFileName}'`);
        });

        console.log(`Schemas extracted from '${inputFile}' and saved to '${outputFile}' successfully.`);
    } catch (error) {
        console.error('Error extracting schemas:', error);
    }
}

async function sendSchemasToRegistry(outputDir, registryBaseUrl) {
    try {
        // Read directory for JSON files
        const files = fs.readdirSync(outputDir);

        // Iterate over each file
        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = `${outputDir}/${file}`;

                // Read JSON file content
                const jsonData = fs.readFileSync(filePath, 'utf8');
                const schemaContent = JSON.parse(jsonData);

                // Construct registry URL based on file name
                const schemaName = file.replace('.json', '');
                const registryUrl = `${registryBaseUrl}/subjects/${schemaName}-value/versions`;

                // POST schema to registry
                const response = await axios.post(registryUrl, {
                    schema: JSON.stringify(schemaContent)
                });

                console.log(`Schema '${schemaName}' posted to schema registry: ${response.status}`);
            }
        }

        console.log(`All schemas from directory '${outputDir}' sent to schema registry '${registryBaseUrl}' successfully.`);
    } catch (error) {
        console.error('Error sending schemas to schema registry:', error.message);
    }
}

// Usage example: node extractSchemas.js input.yaml outputDir
const [inputFile, outputDir] = process.argv.slice(2);
const registryBaseUrl = 'http://localhost:8081';
if (inputFile && outputDir) {
    extractSchemas(inputFile, outputDir);
    sendSchemasToRegistry(outputDir, registryBaseUrl);
} else {
    console.error('Usage: node extractSchemas.js <inputFile.yaml> <outputDir>');
}
