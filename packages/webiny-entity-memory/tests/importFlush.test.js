import { MemoryDriver } from "./../src";
const driver = new MemoryDriver();

describe("import and flush memory test", () => {
    test("should throw exception because ID is missing on third record", async () => {
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

    test("should import data correctly", async () => {
        driver.import("SimpleEntity1", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
            { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
            { id: 3, name: "SameEntity", slug: "sameEntity", enabled: false },
            { id: 4, name: "SameEntity", slug: "sameEntity", enabled: true }
        ]);

        expect(driver.data).toContainAllKeys(["SimpleEntity1"]);
        expect(driver.data.SimpleEntity1.length).toBe(4);

        driver.import("SimpleEntity2", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true }
        ]);

        expect(driver.data).toContainAllKeys(["SimpleEntity1", "SimpleEntity2"]);
        expect(driver.data.SimpleEntity2.length).toBe(1);

        driver.import("SimpleEntity3", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true }
        ]);

        expect(driver.data).toContainAllKeys(["SimpleEntity1", "SimpleEntity2", "SimpleEntity3"]);
        expect(driver.data.SimpleEntity3.length).toBe(1);
    });

    test("import and override existing entries", async () => {
        expect(driver.data.SimpleEntity1[2].name).toEqual("SameEntity");
        expect(driver.data.SimpleEntity1[3].name).toEqual("SameEntity");

        driver.import("SimpleEntity1", [
            { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
            { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
            { id: 3, name: "SameEntity_OVERRIDDEN", slug: "sameEntity", enabled: false },
            { id: 4, name: "SameEntity_OVERRIDDEN", slug: "sameEntity", enabled: true }
        ]);

        expect(driver.data).toContainAllKeys(["SimpleEntity1", "SimpleEntity2", "SimpleEntity3"]);
        expect(driver.data.SimpleEntity1.length).toBe(4);

        expect(driver.data.SimpleEntity1[2].name).toEqual("SameEntity_OVERRIDDEN");
        expect(driver.data.SimpleEntity1[3].name).toEqual("SameEntity_OVERRIDDEN");
    });

    test("should flush data correctly", async () => {
        driver.flush("SimpleEntity3");
        expect(driver.data).toContainAllKeys(["SimpleEntity1", "SimpleEntity2"]);
        expect(driver.data.SimpleEntity2.length).toBe(1);

        driver.flush();
        expect(Object.keys(driver.data)).toHaveLength(0);
    });
});
