import User from "./entities/user";
import { QueryResult } from "webiny-entity";

describe("entity pool entry test", () => {
    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getResult()).toEqual(undefined);
        entityPoolEntry.setResult(new User());
        expect(entityPoolEntry.getResult()).toBeInstanceOf(User);
    });

    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getMeta()).toEqual({});
        entityPoolEntry.setMeta(5);
        expect(entityPoolEntry.getMeta()).toEqual(5);
    });

    test("setCount/getCount methods must work correctly", async () => {
        const collection = new QueryResult();
        collection.setCount(444);
        expect(collection.getCount()).toEqual(444);
    });
});
