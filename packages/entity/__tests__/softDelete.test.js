import { EntityWithSoftDeletes, EntityWithoutSoftDeletes } from "./entities/softDeleteEntity";
import { BooleanAttribute } from "@webiny/model";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("soft delete test", () => {
    beforeEach(() => EntityWithSoftDeletes.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    test("if entity does not have soft delete enabled, it must not have deleted attribute", async () => {
        const entity = new EntityWithoutSoftDeletes();
        expect(entity.getAttribute("deleted")).toEqual(undefined);
    });

    test("if entity has soft delete enabled, it must have deleted attribute", async () => {
        const entity = new EntityWithSoftDeletes();
        expect(entity.getAttribute("deleted")).toBeInstanceOf(BooleanAttribute);
    });

    test("should have delete set to true if delete was called and update log attributes", async () => {
        const entity = new EntityWithSoftDeletes();
        const deleteSpy = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "delete");

        expect(entity.deleted).toEqual(false);
        await entity.save();
        entity.id = "123";

        await entity.delete();
        expect(entity.deleted).toEqual(true);
        expect(deleteSpy.callCount).toEqual(0);

        expect(entity.savedOn !== null).toBe(true);
        expect(entity.updatedOn !== null).toBe(true);
    });

    test("should permanently delete entity if 'permanent' flag was set to true", async () => {
        const entity = new EntityWithSoftDeletes();
        const deleteSpy = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "delete");

        expect(entity.deleted).toEqual(false);
        await entity.save();
        entity.id = "123";

        await entity.delete({ permanent: true });

        expect(deleteSpy.callCount).toEqual(1);
    });

    test("should not append 'deleted' into query when doing finds/count in entity that does not have soft deletes enabled", async () => {
        let query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "count");
        await EntityWithoutSoftDeletes.count();
        expect(query.getCall(0).args[1]).toEqual({});
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "find");
        await EntityWithoutSoftDeletes.find();
        expect(query.getCall(0).args[1]).toEqual({
            page: 1,
            perPage: 10
        });
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "findOne");
        await EntityWithoutSoftDeletes.findById(123);
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithoutSoftDeletes.getDriver(), "findOne");
        await EntityWithoutSoftDeletes.findByIds([123, 234]);
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                id: 123
            }
        });

        expect(query.getCall(1).args[1]).toEqual({
            query: {
                id: 234
            }
        });
        query.restore();
    });

    test("should append 'deleted' into query when doing finds/count in entity that has soft delete enabled", async () => {
        let query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "count");
        await EntityWithSoftDeletes.count();
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: { $ne: true }
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.find();
        expect(query.getCall(0).args[1]).toEqual({
            page: 1,
            perPage: 10,
            query: {
                deleted: { $ne: true }
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findById(123);
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: { $ne: true },
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findByIds([123, 234]);
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: { $ne: true },
                id: 123
            }
        });

        expect(query.getCall(1).args[1]).toEqual({
            query: {
                deleted: { $ne: true },
                id: 234
            }
        });

        query.restore();
    });

    test("should override 'deleted' flag if sent through query", async () => {
        let query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "count");
        await EntityWithSoftDeletes.count({ query: { deleted: true } });
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: true
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "find");
        await EntityWithSoftDeletes.find({ query: { deleted: true } });
        expect(query.getCall(0).args[1]).toEqual({
            page: 1,
            perPage: 10,
            query: {
                deleted: true
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findById(123, { query: { deleted: true } });
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: true,
                id: 123
            }
        });
        query.restore();

        query = sandbox.spy(EntityWithSoftDeletes.getDriver(), "findOne");
        await EntityWithSoftDeletes.findByIds([123, 234], { query: { deleted: true } });
        expect(query.getCall(0).args[1]).toEqual({
            query: {
                deleted: true,
                id: 123
            }
        });
        expect(query.getCall(1).args[1]).toEqual({
            query: {
                deleted: true,
                id: 234
            }
        });
        query.restore();
    });
});
