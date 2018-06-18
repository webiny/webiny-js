import SimpleEntity from "./entities/simpleEntity";

describe("findById test", () => {
    test("findById - should find previously inserted entity", async () => {
        SimpleEntity.getDriver()
            .flush("SimpleEntity")
            .import("SimpleEntity", [
                {
                    id: 1,
                    name: "This is a test",
                    slug: "thisIsATest",
                    enabled: true
                }
            ]);

        const simpleEntity = await SimpleEntity.findById(1);

        expect(simpleEntity.id).toEqual(1);
        expect(simpleEntity.name).toEqual("This is a test");
        expect(simpleEntity.slug).toEqual("thisIsATest");
        expect(simpleEntity.enabled).toBe(true);
    });
});
