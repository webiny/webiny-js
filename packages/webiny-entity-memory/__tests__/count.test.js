import SimpleEntity from "./entities/simpleEntity";

describe("count test", () => {
    test("count - should count entities correctly", async () => {
        SimpleEntity.getDriver().flush();
        expect(await SimpleEntity.count()).toEqual(0);

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        expect(await SimpleEntity.count()).toEqual(1);
    });
});
