import { Entity } from "webiny-api";
import { MySQLDriver } from "webiny-entity-mysql";

import importData from "./import/data";
import { connection } from "./../../configs/database";

export default async () => {
    Entity.driver = new MySQLDriver({ connection });

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
                } else {
                    console.log(e);
                }
            }
        }
    }
    console.log("Finished importing!");
    return true;
};
