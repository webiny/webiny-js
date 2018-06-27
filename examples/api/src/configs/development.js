import mysql from "mysql";
import { File, Image, User, ApiToken } from "webiny-api/lib/entities";
import { createIdentity, credentialsStrategy } from "webiny-api/lib/security";
import { MySQLDriver } from "webiny-entity-mysql";
import imageProcessor from "webiny-jimp";
import LocalDriver from "webiny-file-storage-local";
import { Storage } from "webiny-file-storage";

// Configure default storage
const localDriver = new LocalDriver({
    directory: __dirname + "/../../storage",
    createDatePrefix: false,
    publicUrl: "http://localhost:9000/storage/"
});

const connection = mysql.createPool({
    host: "localhost",
    port: 32768,
    user: "root",
    password: "dev",
    database: "webiny",
    timezone: "Z",
    connectionLimit: 100
});

export default () => ({
    entity: {
        // Instantiate driver with DB connection
        driver: new MySQLDriver({ connection }),
        attributes: ({ fileAttributes, imageAttributes }) => {
            fileAttributes({
                entity: File,
                storage: new Storage(localDriver)
            });
            imageAttributes({
                entity: Image,
                processor: imageProcessor(),
                quality: 90,
                storage: new Storage(localDriver)
            });
        }
    },
    security: {
        token: { secret: "MyS3cr3tK3Y" },
        identities: [
            createIdentity(User, { strategy: credentialsStrategy() }),
            createIdentity(ApiToken)
        ]
    }
});
