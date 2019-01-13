import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import CustomIdEntity from "./entities/customIdEntity";
const sandbox = sinon.sandbox.create();
import { database, collection, findCursor } from "./database";
import mdbid from "mdbid";

describe("save error test", function() {
    afterEach(() => sandbox.restore());

    it("should save new entity but an exception must be thrown", async () => {
        const insertOneStub = sandbox.stub(collection, "insertOne").callsFake(() => {
            throw Error("This is an error.");
        });

        const simpleEntity = new SimpleEntity();
        try {
            await simpleEntity.save();
        } catch (e) {
            return;
        } finally {
            insertOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });

    it("should update existing entity but an exception must be thrown", async () => {
        const insertOneStub = sandbox.stub(collection, "insertOne").callsFake(() => {});

        // sandbox.stub(SimpleEntity.getDriver().getConnection(), "query").callsFake(() => {});
        const newId = mdbid();
        sandbox.stub(SimpleEntity.getDriver().constructor, "__generateID").callsFake(() => newId);

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        insertOneStub.restore();

        assert.equal(simpleEntity.id, newId);

        const updateOneStub = sandbox.stub(collection, "updateOne").callsFake(() => {
            throw Error("This is an error.");
        });

        try {
            simpleEntity.name = "test2";
            await simpleEntity.save();
        } catch (e) {
            return;
        } finally {
            updateOneStub.restore();
        }
        throw Error(`Error should've been thrown.`);
    });
});
