import SimpleEntity from "./entities/simpleEntity";

describe("save test", () => {
    test("should save new and update entity correctly", async () => {
        SimpleEntity.getDriver().flush();

        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "Test1";
        await simpleEntity.save();
        expect(simpleEntity.id.length).toBe(24);

        const id = simpleEntity.id;

        const foundEntity = await SimpleEntity.findById(id);
        expect(foundEntity.id).toEqual(id);
        expect(foundEntity.name).toEqual("Test1");

        foundEntity.name = "Test2";
        await foundEntity.save();

        const foundEntity2 = await SimpleEntity.findById(foundEntity.id);
        expect(foundEntity2.name).toEqual("Test2");
    });
});
