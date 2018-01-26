import { assert } from "chai";
import sinon from "sinon";
import SimpleEntity from "./entities/simpleEntity";
import mdbid from "mdbid";
const sandbox = sinon.sandbox.create();

describe("save test", function() {
    afterEach(() => sandbox.restore());

    it("should save new entity into database and entity should receive an integer ID", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, { insertId: 1 });
            });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(simpleEntity.id, 1);
    });

    it("should update existing entity", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, { insertId: 1 });
            });

        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();

        assert.equal(simpleEntity.id, 1);

        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, { insertId: 1 });
            });

        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
    });

    it("should save new entity into database and entity should receive a hash ID", async () => {
        sandbox
            .stub(SimpleEntity.getDriver().getConnection(), "query")
            .callsFake((query, callback) => {
                callback(null, { insertId: 1 });
            });

        SimpleEntity.getDriver().setIdGenerator(() => mdbid());
        const simpleEntity = new SimpleEntity();
        await simpleEntity.save();
        SimpleEntity.getDriver()
            .getConnection()
            .query.restore();
        SimpleEntity.getDriver().setIdGenerator(null);

        assert.isString(simpleEntity.id);
        assert.lengthOf(simpleEntity.id, 24);
    });
});
