import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import { collection } from "./database";
import mongodb from "mongodb";
import mdbid from "mdbid";

const sandbox = sinon.sandbox.create();

describe("save test", function() {
    afterEach(() => sandbox.restore());

    it("must generate correct query", async () => {
        const insertOneSpy = sandbox.stub(collection, "insertOne");

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        const saveData = insertOneSpy.getCall(0).args[0];
        assert.deepEqual(saveData, {
            id: simpleEntity.id,
            slug: "",
            enabled: true,
            _id: saveData._id
        });

        assert.instanceOf(saveData._id, mongodb.ObjectID);

        insertOneSpy.restore();

        simpleEntity.name = "test2";
        const updateOneSpy = sandbox.stub(collection, "updateOne");
        await simpleEntity.save();

        assert.deepEqual(updateOneSpy.getCall(0).args[0], { id: simpleEntity.id });
        assert.deepEqual(updateOneSpy.getCall(0).args[1], {
            $set: {
                name: "test2",
                slug: "test2"
            }
        });

        updateOneSpy.restore();
    });

    it("should save new entity into database and entity should receive a new ID", async () => {
        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        assert.lengthOf(simpleEntity.id, 24);
        assert.isTrue(SimpleEntity.isId(simpleEntity.id));
    });

    it("should update existing entity", async () => {
        const newId = mdbid();
        const generateIdStub = sandbox
            .stub(SimpleEntity.getDriver().constructor, "__generateID")
            .callsFake(() => {
                return newId;
            });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();

        assert.equal(simpleEntity.id, newId);

        await simpleEntity.save();
        assert.equal(simpleEntity.id, newId);
        generateIdStub.restore();
    });
});
