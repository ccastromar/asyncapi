const { Kafka } = require('kafkajs');
const Ajv = require('ajv');
const AjvFormats = require('ajv-formats');

const ajv = new Ajv({ allErrors: true }); // Enable all error messages
// Define custom format for 'email'
ajv.addFormat('email', {
  type: 'string',
  format: 'email',
  validate: function (email) {
    // Regular expression for basic email validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },
});

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'my-producer',
  brokers: ['localhost:9092'],  // Adjust the broker address as needed
});

// JSON Schema Registry configuration (e.g., Confluent Schema Registry)
const schemaRegistryUrl = 'http://localhost:8081';
const schemaSubject = 'CustomerDetails'; // Replace with your schema subject name

// JSON Schema for validation
const jsonSchema = 
{
  "type": "object",
  "properties": {
    "customerId": {
      "type": "string",
      "description": "Unique identifier for the customer"
    },
    "firstName": {
      "type": "string",
      "description": "Customer's first name"
    },
    "lastName": {
      "type": "string",
      "description": "Customer's last name"
    },
    "email": {
      "type": "string",
      "format": "email",
      "description": "Customer's email address"
    }
  }
}
;

// Create a producer
const producer = kafka.producer();

// Function to produce a message
const produceMessage = async () => {
  await producer.connect();
  try {
    const message = {
      key: 'key1',
      value: JSON.stringify({
  customerId: 'C123456',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com'
      }),
    };

// Validate the data against the schema
const validate = ajv.compile(jsonSchema);
const isValid = validate(message);
if (!isValid) {
  console.error('Validation errors:', validate.errors);
}

    await producer.send({
      topic: 'user-signedup',  // Replace with your Kafka topic
      messages: [message],
    });

    console.log('Message sent successfully:', message);
  } catch (error) {
    console.error('Error in sending message:', error);
  } finally {
    await producer.disconnect();
  }
};

produceMessage().catch(console.error);

