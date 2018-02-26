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
            tables: [TableA, TableB],
            execute: true
        });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();
        assert.equal(syncSpy.callCount, 4);
    });

    it("must not execute queries", async () => {
        const sync = new Sync({ tables: [TableA, TableB] });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();
        assert.equal(syncSpy.callCount, 2);
    });

    it("should log a warning - no tables passed", async () => {
        const sync = new Sync();

        await sync.execute();
        const log = sync.getLog();
        assert.lengthOf(log, 1);
        assert.equal(log[0].type, "warning");
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
        assert.equal(log[4].type, "error");
        assert.equal(log[4].message, "Sync error!");
        assert.equal(log[4].data.message, "Error.");
    });
});
