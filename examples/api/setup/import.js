import { Entity } from "webiny-api";
import registerAttributes from "webiny-api-security/src/attributes/registerAttributes";
import data from "./import/data";
import { connection } from "./../connection";
import { MySQLDriver } from "webiny-entity-mysql";

export default async () => {
    Entity.driver = new MySQLDriver({ connection });

    registerAttributes(null);

    console.log("Importing data...");
    for (let i = 0; i < data.length; i++) {
        const EntityClass = data[i].entity;
        for (let j = 0; j < data[i].data.length; j++) {
            const obj = data[i].data[j];
            const instance = new EntityClass();
            try {
                await instance.populate(obj).save();
            } catch (e) {
                console.log(e);
                if (e.data) {
                    console.log(e.data.invalidAttributes);
                }
            }
        }
    }
    console.log("Finished importing!");
    return true;
};
