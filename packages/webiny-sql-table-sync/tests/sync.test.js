// @flow
import { assert } from "chai";
import sinon from "sinon";
import { Sync } from "./..";
import { TableA, TableB } from "./tables";

const sandbox = sinon.sandbox.create();

describe("sync test", function() {
    afterEach(() => sandbox.restore());
    it("should execute queries", async () => {
        const sync = new Sync({
            tables: [TableA, TableB]
        });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();

        assert.deepEqual(syncSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(syncSpy.getCall(1).args[1], {});
        assert.deepEqual(syncSpy.getCall(2).args[1], { returnSQL: true });
        assert.deepEqual(syncSpy.getCall(3).args[1], {});
        assert.equal(syncSpy.callCount, 4);
    });

    it("must not execute queries", async () => {
        const sync = new Sync({ preview: true, tables: [TableA, TableB] });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();

        assert.deepEqual(syncSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(syncSpy.getCall(1).args[1], { returnSQL: true });
        assert.equal(syncSpy.callCount, 2);
    });

    it("must generate DROP statement first and not execute", async () => {
        const sync = new Sync({ preview: true, drop: true, tables: [TableA, TableB] });

        const dropSpy = sandbox.spy(TableA.getDriver(), "drop");
        const createSpy = sandbox.spy(TableA.getDriver(), "create");
        await sync.execute();
        assert.deepEqual(dropSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(dropSpy.getCall(1).args[1], { returnSQL: true });
        assert.equal(dropSpy.callCount, 2);

        assert.deepEqual(createSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(createSpy.getCall(1).args[1], { returnSQL: true });
        assert.equal(createSpy.callCount, 2);
    });

    it("must generate DROP statement first and not execute", async () => {
        const sync = new Sync({ drop: true, tables: [TableA, TableB] });

        const dropSpy = sandbox.spy(TableA.getDriver(), "drop");
        const createSpy = sandbox.spy(TableA.getDriver(), "create");
        await sync.execute();
        assert.deepEqual(dropSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(dropSpy.getCall(1).args[1], {});
        assert.deepEqual(dropSpy.getCall(2).args[1], { returnSQL: true });
        assert.deepEqual(dropSpy.getCall(3).args[1], {});
        assert.equal(dropSpy.callCount, 4);

        assert.deepEqual(createSpy.getCall(0).args[1], { returnSQL: true });
        assert.deepEqual(createSpy.getCall(1).args[1], {});
        assert.deepEqual(createSpy.getCall(2).args[1], { returnSQL: true });
        assert.deepEqual(createSpy.getCall(3).args[1], {});
        assert.equal(createSpy.callCount, 4);
    });

    it("should log a warning - no tables passed", async () => {
        const sync = new Sync();

        await sync.execute();
        const log = sync.getLog();
        assert.lengthOf(log, 1);
        assert.equal(log[0].tags.includes("warning"), true);
    });

    it("must log errors", async () => {
        const sync = new Sync({ tables: [TableA, TableB], execute: true });

        const syncSpy = sandbox
            .stub(TableA.getDriver(), "sync")
            .onCall(1)
            .callsFake(() => {
                throw Error("Error.");
            });

        await sync.execute();

        syncSpy.restore();

        const log = sync.getLog();
        assert.isTrue(log[4].tags.includes("error"));
        assert.equal(log[4].data.error.message, "Error.");
    });

    it("must return all tables", async () => {
        const sync = new Sync({ tables: [TableA, TableB], execute: true });
        assert.equal(sync.getTables()[0], TableA);
        assert.equal(sync.getTables()[1], TableB);
    });
});
