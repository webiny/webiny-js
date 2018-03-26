import { middleware, endpointMiddleware, File, Image } from "webiny-api";
import {
    User,
    SecurityApp,
    JwtToken,
    credentialsStrategy,
    authenticationMiddleware,
    authorizationMiddleware
} from "webiny-api-security";
import { MySQLDriver } from "webiny-entity-mysql";
import imageProcessor from "webiny-jimp";
import LocalDriver from "webiny-file-storage-local";
import { Storage } from "webiny-file-storage";
import addDays from "date-fns/add_days";
import { connection } from "./database";

export default () => {
    // Configure default storage
    const localDriver = new LocalDriver({
        directory: __dirname + "/storage",
        createDatePrefix: false,
        publicUrl: "https://cdn.domain.com"
    });

    return middleware({
        // Configure middleware for request processing
        use: [
            // First try authenticating the client using the token.
            authenticationMiddleware({ token: "Authorization" }),
            // Process request
            endpointMiddleware({
                // Check authorization before executing matched API method
                beforeApiMethod: [authorizationMiddleware()]
            })
        ],
        // Instantiate API apps
        apps: [
            new SecurityApp({
                authentication: {
                    token: new JwtToken({ secret: "MyS3cr3tK3Y" }),
                    strategies: {
                        credentials: credentialsStrategy({
                            usernameAttribute: 'email'
                        })
                    },
                    identities: [
                        {
                            identity: User,
                            authenticate: [
                                {
                                    strategy: "credentials",
                                    expiresOn: req => addDays(new Date(), req.body.remember ? 30 : 1),
                                    apiMethod: {
                                        name: "Auth.User.Login",
                                        pattern: "/login-user"
                                    }
                                }
                            ]
                        }
                    ]
                }
            })
        ],
        // Entity layer
        entity: {
            // Instantiate driver with DB connection
            driver: new MySQLDriver({ connection }),
            // Configure entity attributes
            attributes: ({ bufferAttribute, fileAttributes, imageAttributes }) => {
                bufferAttribute();
                fileAttributes({
                    entity: File,
                    storage: new Storage(localDriver)
                });
                imageAttributes({
                    entity: Image,
                    processor: imageProcessor(),
                    quality: 90
                });
            }
        }
    })
};