const fs = require('fs');
const axios = require('axios');

async function postSchemaToRegistry(schemaFile, registryBaseUrl) {
    const name = 'OrderPayload';
    try {
        // Read schema from file
        const schemaContent = fs.readFileSync(schemaFile, 'utf8');
        console.log(schemaContent);
        const schema = JSON.parse(schemaContent);
        console.log(schema);
        const escapedJsonString = schema.replace(/"/g, '\\"');
        console.log(escapedJsonString);

        const registryUrl = `${registryBaseUrl}/subjects/${name}/versions`;

         const response = await axios.post(registryBaseUrl, {
             schema: JSON.stringify(schema),
             schemaType: 'JSON',
             compatibility: 'BACKWARD',
             references:JSON.stringify([ { 'name': 'CustomerDetails.schema.json', 'subject': 'CustomerDetails', 'version': '1' }])
         });
         console.log(`Schema '${name}' posted to schema registry: ${response.status}`);
     } catch (error) {
            if (error.response) {
                console.error(`Error posting schema '${name}' to schema registry:`, error.response.data);
            } else {
                console.error(`Error posting schema '${name}' to schema registry:`, error.message);
            }
     }

}

// Example usage: node postSchemaToRegistry.js schema.json http://schema-registry-url:port/subjects/your-schema-name/versions
const [schemaFile, registryBaseUrl] = process.argv.slice(2);
if (schemaFile && registryBaseUrl) {
    postSchemaToRegistry(schemaFile, registryBaseUrl);
} else {
    console.error('Usage: node postSchemaToRegistry.js <schemaFile> <registryBaseUrl>');
}

