import User from "./entities/user";
import { expect } from "chai";
import { EntityPoolEntry } from "../src";

describe("entity pool entry test", () => {
    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new EntityPoolEntry();
        expect(entityPoolEntry.getEntity()).to.be.undefined;
        entityPoolEntry.setEntity(new User());
        expect(entityPoolEntry.getEntity()).to.be.instanceOf(User);
    });

    test("setEntity/getEntity methods must work correctly", async () => {
        const entityPoolEntry = new EntityPoolEntry();
        expect(entityPoolEntry.getMeta().createdOn).to.be.instanceof(Date);
        entityPoolEntry.setMeta(null);
        expect(entityPoolEntry.getMeta()).to.be.null;
    });
});
