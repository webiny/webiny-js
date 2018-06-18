import SimpleEntity from "./entities/simpleEntity";

describe("find test", () => {
    test("find - should find entities", async () => {
        SimpleEntity.getDriver()
            .flush()
            .import("SimpleEntity", [
                { id: 1, name: "This is a test", slug: "thisIsATest", enabled: true },
                { id: 2, name: "This is a test 222", slug: "thisIsATest222", enabled: false },
                { id: 3, name: "SameEntity", slug: "sameEntity", enabled: false },
                { id: 4, name: "SameEntity", slug: "sameEntity", enabled: true }
            ]);

        let entities = await SimpleEntity.find();

        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(4);

        expect(entities[0].id).toEqual(1);
        expect(entities[0].name).toEqual("This is a test");
        expect(entities[0].slug).toEqual("thisIsATest");
        expect(entities[0].enabled).toBe(true);

        expect(entities[1].id).toEqual(2);
        expect(entities[1].name).toEqual("This is a test 222");
        expect(entities[1].slug).toEqual("thisIsATest222");
        expect(entities[1].enabled).toBe(false);

        entities = await SimpleEntity.find({ query: { name: "SameEntity" } });

        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(2);

        expect(entities[0].id).toEqual(3);
        expect(entities[0].name).toEqual("SameEntity");
        expect(entities[0].slug).toEqual("sameEntity");
        expect(entities[0].enabled).toBe(false);

        expect(entities[1].id).toEqual(4);
        expect(entities[1].name).toEqual("SameEntity");
        expect(entities[1].slug).toEqual("sameEntity");
        expect(entities[1].enabled).toBe(true);

        entities = await SimpleEntity.find({ query: { name: "SameEntity", enabled: true } });

        expect(Array.isArray(entities)).toBe(true);
        expect(entities.length).toBe(1);

        expect(entities[0].id).toEqual(4);
        expect(entities[0].name).toEqual("SameEntity");
        expect(entities[0].slug).toEqual("sameEntity");
        expect(entities[0].enabled).toBe(true);
    });
});
