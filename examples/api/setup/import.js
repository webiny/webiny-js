import { Entity } from "webiny-api";
import { Permission } from "webiny-api-security";
import registerAttributes from "webiny-api-security/src/attributes/registerAttributes";
import data from "./import/data";
import connectionData from "./../connection";
import { MySQLDriver } from "webiny-entity-mysql";

export default async () => {
    Entity.driver = new MySQLDriver(connectionData);

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
                console.log(e.message);
            }
        }
    }

    // Check JSON data
    const permissions = await Permission.find();
    const json = await permissions.toJSON("id,name,slug,rules[classId,methods[method]");
    console.log(JSON.stringify(json, null, 2));
};
