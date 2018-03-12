import { Entity } from "webiny-api";
import { MySQLDriver } from "webiny-entity-mysql";
import LocalDriver from "webiny-file-storage-local";
import { Storage } from "webiny-file-storage";
import { User, AuthenticationService } from "webiny-api-security";
import registerSecurityAttributes from "webiny-api-security/src/attributes/registerAttributes";
import { File, Image } from "webiny-api";
import registerBufferAttribute from "webiny-api/src/attributes/registerBufferAttribute";
import registerFileAttributes from "webiny-api/src/attributes/registerFileAttributes";
import registerImageAttributes from "webiny-api/src/attributes/registerImageAttributes";

import importData from "./import/data";
import { connection } from "./../configs/database";

export default async () => {
    Entity.driver = new MySQLDriver({ connection });

    const authentication = new AuthenticationService({
        identities: [{ identity: User }]
    });

    // Configure default storage
    const localDriver = new LocalDriver({
        directory: __dirname + "/storage",
        createDatePrefix: false,
        publicUrl: "https://cdn.domain.com"
    });

    const storage = new Storage(localDriver);

    // Register attributes
    registerSecurityAttributes(authentication);
    registerBufferAttribute();
    registerFileAttributes({ entity: File, storage });
    registerImageAttributes({ entity: Image });

    console.log("Importing data...");
    for (let i = 0; i < importData.length; i++) {
        const { entity, data } = await importData[i]();
        for (let j = 0; j < data.length; j++) {
            const obj = data[j];
            const instance = new entity();
            try {
                instance.populate(obj);
                await instance.save();
            } catch (e) {
                if (e.data) {
                    console.log(e.data.invalidAttributes);
                }
            }
        }
    }
    console.log("Finished importing!");
    return true;
};
