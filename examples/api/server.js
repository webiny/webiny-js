import express from "express";
import { middleware, endpointMiddleware, File, Image } from "webiny-api";
import {
    SecurityApp,
    authenticationMiddleware,
    authorizationMiddleware
} from "webiny-api-security";
import { MemoryDriver } from "webiny-entity-memory";
import imageProcessor from "webiny-jimp";

const app = express();
app.use(express.json());
app.use(
    // Configure Webiny middleware.
    // The entire config can be loaded based on the environment.
    middleware({
        // Configure middleware for request processing
        use: [
            // First try authenticating the client using the token.
            authenticationMiddleware({ token: "Api-Token" }),
            // Process request
            endpointMiddleware({
                // Check authorization before executing matched API method
                beforeApiMethod: [authorizationMiddleware()]
            })
        ],
        // Instantiate API apps
        apps: [
            new SecurityApp({
                /* security config */
            })
        ],
        // Entity layer
        entity: {
            // Instantiate driver with DB connection
            driver: new MemoryDriver(),
            // Configure entity attributes
            attributes: ({ fileAttributes, imageAttributes }) => {
                fileAttributes({ entity: File });
                imageAttributes({ entity: Image, processor: imageProcessor() });
            }
        }
    })
);
