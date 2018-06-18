import User from "./entities/user";
import { expect } from "chai";
import { QueryResult } from "../src";

describe("entity pool entry test", () => {
    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getResult()).to.equal(undefined);
        entityPoolEntry.setResult(new User());
        expect(entityPoolEntry.getResult()).to.be.instanceOf(User);
    });

    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getMeta()).to.deep.equal({});
        entityPoolEntry.setMeta(5);
        expect(entityPoolEntry.getMeta()).to.be.equal(5);
    });

    test("setCount/getCount methods must work correctly", async () => {
        const collection = new QueryResult();
        collection.setCount(444);
        expect(collection.getCount()).to.equal(444);
    });
});
