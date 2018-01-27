import User from "./entities/user";
import { expect } from "chai";
import { QueryResult } from "../src";

describe("entity pool entry test", function() {
    it("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getResult()).to.be.undefined;
        entityPoolEntry.setResult(new User());
        expect(entityPoolEntry.getResult()).to.be.instanceOf(User);
    });

    it("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new QueryResult();
        expect(entityPoolEntry.getMeta()).to.be.undefined;
        entityPoolEntry.setMeta(5);
        expect(entityPoolEntry.getMeta()).to.be.equal(5);
    });
});
