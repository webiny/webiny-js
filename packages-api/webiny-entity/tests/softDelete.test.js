import { EntityWithSoftDeletes, EntityWithoutSoftDeletes } from "./entities/softDeleteEntity";
import { expect } from "chai";
import { BooleanAttribute } from "webiny-model";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("soft delete test", function() {
    beforeEach(() => EntityWithSoftDeletes.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("if entity does not have soft delete enabled, it must not have deleted attribute", async () => {
        const entity = new EntityWithoutSoftDeletes();
        expect(entity.getAttribute("deleted")).to.equal(undefined);
    });

    it("if entity has soft delete enabled, it must have deleted attribute", async () => {
        const entity = new EntityWithSoftDeletes();
        expect(entity.getAttribute("deleted")).to.be.instanceOf(BooleanAttribute);
    });

    it("should have delete set to true if delete was called", async () => {
        const entity = new EntityWithSoftDeletes();

        expect(entity.deleted).to.equal(false);
        await entity.save();
        entity.id = "123";

        await entity.delete();
        expect(entity.deleted).to.equal(true);
    });

    it("should not append 'deleted' into query when doing finds/count in entity that does not have soft deletes enabled", async () => {
        let query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "count");
        await EntityWithoutSoftDeletes.count();
        expect(query.getCall(0).args[1]).to.deep.equal({});
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "find");
        await EntityWithoutSoftDeletes.find();
        expect(query.getCall(0).args[1]).to.deep.equal({});
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "findOne");
        await EntityWithoutSoftDeletes.findById(123);
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "find");
        await EntityWithoutSoftDeletes.findByIds([123, 234]);
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                id: [123, 234]
            }
        });
        query.restore();
    });

    it("should append 'deleted' into query when doing finds/count in entity that has soft delete enabled", async () => {
        let query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "count");
        await EntityWithSoftDeletes.count();
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: false
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.find();
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: false
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findById(123);
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: false,
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.findByIds([123, 234]);
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: false,
                id: [123, 234]
            }
        });
        query.restore();
    });

    it("should override 'deleted' flag if sent through query", async () => {
        let query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "count");
        await EntityWithSoftDeletes.count({ query: { deleted: true } });
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: true
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.find({ query: { deleted: true } });
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: true
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findById(123, { query: { deleted: true } });
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: true,
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.findByIds([123, 234], { query: { deleted: true } });
        expect(query.getCall(0).args[1]).to.deep.equal({
            query: {
                deleted: true,
                id: [123, 234]
            }
        });
        query.restore();
    });
});
