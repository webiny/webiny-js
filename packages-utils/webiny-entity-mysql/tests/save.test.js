import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import CustomIdEntity from "./entities/customIdEntity";

const sandbox = sinon.sandbox.create();

describe("save test", function() {
    afterEach(() => sandbox.restore());

    it("should save new entity into database and entity should receive an integer ID", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query");

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.lengthOf(simpleEntity.id, 24);
        assert.isTrue(SimpleEntity.isId(simpleEntity.id));
    });

    it("should update existing entity", async () => {
        sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});
        sandbox.stub(SimpleEntity.getDriver(), "generateID").callsFake(() => {
            return "a";
        });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        assert.equal(simpleEntity.id, "a");

        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        assert.equal(simpleEntity.id, "a");
    });

    it("should save new entity into database and entity should receive a hash ID", async () => {
        sandbox.stub(CustomIdEntity.getDriver().getConnection(), "query").callsFake(() => {
            return { insertId: 1 };
        });

        const customIdEntity = new CustomIdEntity();
        await customIdEntity.save();
        CustomIdEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.isString(customIdEntity.id);
        assert.lengthOf(customIdEntity.id, 24);
    });
});
