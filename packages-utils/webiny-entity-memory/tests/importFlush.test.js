import { assert } from "chai";
import { MemoryDriver } from "./../lib";
const driver = new MemoryDriver();

describe("import and flush memory test", function() {
    it("should throw exception because ID is missing on third record", async () => {
        try {
            driver.import("SimpleEntity", [
                { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
                { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
                { id: null, name: "SameEntity", slug: "sameEntity", enabled: false },
                { id: 4, name: "SameEntity", slug: "sameEntity", enabled: true }
            ]);
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it("should import data correctly", async () => {
        driver.import("SimpleEntity1", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
            { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
            { id: 3, name: "SameEntity", slug: "sameEntity", enabled: false },
            { id: 4, name: "SameEntity", slug: "sameEntity", enabled: true }
        ]);

        assert.hasAllKeys(driver.data, "SimpleEntity1");
        assert.lengthOf(driver.data.SimpleEntity1, 4);

        driver.import("SimpleEntity2", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true }
        ]);

        assert.hasAllKeys(driver.data, ["SimpleEntity1", "SimpleEntity2"]);
        assert.lengthOf(driver.data.SimpleEntity2, 1);

        driver.import("SimpleEntity3", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true }
        ]);

        assert.hasAllKeys(driver.data, ["SimpleEntity1", "SimpleEntity2", "SimpleEntity3"]);
        assert.lengthOf(driver.data.SimpleEntity3, 1);
    });

    it("import and override existing entries", async () => {
        assert.equal(driver.data.SimpleEntity1[2].name, "SameEntity");
        assert.equal(driver.data.SimpleEntity1[3].name, "SameEntity");

        driver.import("SimpleEntity1", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
            { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
            { id: 3, name: "SameEntity_OVERRIDDEN", slug: "sameEntity", enabled: false },
            { id: 4, name: "SameEntity_OVERRIDDEN", slug: "sameEntity", enabled: true }
        ]);

        assert.hasAllKeys(driver.data, ["SimpleEntity1", "SimpleEntity2", "SimpleEntity3"]);
        assert.lengthOf(driver.data.SimpleEntity1, 4);

        assert.equal(driver.data.SimpleEntity1[2].name, "SameEntity_OVERRIDDEN");
        assert.equal(driver.data.SimpleEntity1[3].name, "SameEntity_OVERRIDDEN");
    });

    it("should flush data correctly", async () => {
        driver.flush("SimpleEntity3");
        assert.hasAllKeys(driver.data, ["SimpleEntity1", "SimpleEntity2"]);
        assert.lengthOf(driver.data.SimpleEntity2, 1);

        driver.flush();
        assert.isEmpty(driver.data);
    });
});
