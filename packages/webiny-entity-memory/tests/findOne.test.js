import SimpleEntity from "./entities/simpleEntity";

describe("findOne test", () => {
    beforeAll(() => {
        SimpleEntity.getDriver()
            .flush()
            .import("SimpleEntity", [
                { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true }
            ]);
    });

    test("findOne - should load existing entity", async () => {
        const simpleEntity = await SimpleEntity.findOne({ query: { id: 1 } });
        expect(simpleEntity.id).toEqual(1);
        expect(simpleEntity.name).toEqual("This is a test");
        expect(simpleEntity.slug).toEqual("thisIsATest");
        expect(simpleEntity.enabled).toBe(true);
    });
});
