import User from "./entities/user";
import { EntityPoolEntry } from "webiny-entity";

describe("entity pool entry test", () => {
    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new EntityPoolEntry();
        expect(entityPoolEntry.getEntity()).toBeUndefined;
        entityPoolEntry.setEntity(new User());
        expect(entityPoolEntry.getEntity()).toBeInstanceOf(User);
    });

    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new EntityPoolEntry();
        expect(entityPoolEntry.getMeta().createdOn).toBeInstanceOf(Date);
        entityPoolEntry.setMeta(null);
        expect(entityPoolEntry.getMeta()).toBe(null);
    });
});
