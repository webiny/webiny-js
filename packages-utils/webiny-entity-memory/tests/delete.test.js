import SimpleEntity from "./entities/simpleEntity";
import { assert } from "chai";

describe("delete test", function() {
    before(() => SimpleEntity.getDriver().flush());

    it("should throw an exception because entity was not previously saved", async () => {
        try {
            const simpleEntity = new SimpleEntity();
            await simpleEntity.delete();
        } catch (e) {
            return;
        }
        throw Error(`Error should've been thrown.`);
    });

    it("should delete entity", async () => {
        const simpleEntity = new SimpleEntity();
        simpleEntity.name = "This is a test";
        await simpleEntity.save();

        assert.lengthOf(SimpleEntity.getDriver().data["SimpleEntity"], 1);

        // Try do delete an entity that does not exist.
        const simpleEntity2 = new SimpleEntity();
        simpleEntity2.id = "12345";

        await simpleEntity2.delete();
        assert.lengthOf(SimpleEntity.getDriver().data["SimpleEntity"], 1);

        await simpleEntity.delete();
        assert.lengthOf(SimpleEntity.getDriver().data["SimpleEntity"], 0);
    });

    it("should not delete anything since there is no entries yet", async () => {
        assert.isUndefined(SimpleEntity.getDriver().data.XYZEntity);

        class XYZEntity extends SimpleEntity {}

        XYZEntity.classId = "XYZEntity";

        const entity = new XYZEntity();

        await SimpleEntity.getDriver().delete(entity);
        assert.isUndefined(SimpleEntity.getDriver().data.XYZEntity);
    });
});
