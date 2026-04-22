const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'AI Exam API Documentation',
            version: '1.0.0',
            description: 'API documentation for AI Exam project',
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT}/api/v1`,
                // url: `https://unoratorial-choppily-chelsie.ngrok-free.dev/api/v1`,
            },
        ],
        components: {
            securitySchemes: {
                authorization: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Authorization',
                },
                apiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'api_key',
                },
                acceptLanguage: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Accept-Language',
                },
                currency: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'Accept-Currency',
                },
            },
        },
        security: [
            {
                authorization: [],
                apiKeyAuth: [],
                acceptLanguage: [],
                currency: [],
            },
        ],
    },
    apis: [
        // path.join(__dirname, '../modules/v1/auth/authRoutes.js'),

    ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
