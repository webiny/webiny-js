import SimpleEntity from "./entities/simpleEntity";

describe("delete test", () => {
    beforeAll(() => SimpleEntity.getDriver().flush());

    test("should throw an exception because entity was not previously saved", async () => {
        try {
            const simpleEntity = new SimpleEntity();
            await simpleEntity.delete();
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });

    test("should delete entity", async () => {
        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "This is a test";
        await simpleEntity.save();

        expect(SimpleEntity.getDriver().data["SimpleEntity"].length).toBe(1);

        // Try do delete an entity that does not exist.
        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.id = "12345";

        await simpleEntity2.delete();
        expect(SimpleEntity.getDriver().data["SimpleEntity"].length).toBe(1);

        await simpleEntity.delete();
        expect(SimpleEntity.getDriver().data["SimpleEntity"].length).toBe(0);
    });

    test("should not delete anything since there is no entries yet", async () => {
        expect(SimpleEntity.getDriver().data.XYZEntity).not.toBeDefined();

        class XYZEntity extends SimpleEntity {}

        XYZEntity.classId = "XYZEntity";

        const entity = new XYZEntity();

        await SimpleEntity.getDriver().delete(entity);
        expect(SimpleEntity.getDriver().data.XYZEntity).not.toBeDefined();
    });
});
