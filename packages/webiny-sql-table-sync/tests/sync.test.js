// @flow
import sinon from "sinon";
import { Sync } from "./..";
import { TableA, TableB } from "./tables";

const sandbox = sinon.sandbox.create();

describe("sync test", () => {
    afterEach(() => sandbox.restore());
    test("should execute queries", async () => {
        const sync = new Sync({
            tables: [TableA, TableB]
        });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();

        expect(syncSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(syncSpy.getCall(1).args[1]).toEqual({});
        expect(syncSpy.getCall(2).args[1]).toEqual({ returnSQL: true });
        expect(syncSpy.getCall(3).args[1]).toEqual({});
        expect(syncSpy.callCount).toEqual(4);
    });

    test("must not execute queries", async () => {
        const sync = new Sync({ preview: true, tables: [TableA, TableB] });

        const syncSpy = sandbox.spy(TableA.getDriver(), "sync");
        await sync.execute();

        expect(syncSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(syncSpy.getCall(1).args[1]).toEqual({ returnSQL: true });
        expect(syncSpy.callCount).toEqual(2);
    });

    test("must generate DROP statement first and not execute", async () => {
        const sync = new Sync({ preview: true, drop: true, tables: [TableA, TableB] });

        const dropSpy = sandbox.spy(TableA.getDriver(), "drop");
        const createSpy = sandbox.spy(TableA.getDriver(), "create");
        await sync.execute();
        expect(dropSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(dropSpy.getCall(1).args[1]).toEqual({ returnSQL: true });
        expect(dropSpy.callCount).toEqual(2);

        expect(createSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(createSpy.getCall(1).args[1]).toEqual({ returnSQL: true });
        expect(createSpy.callCount).toEqual(2);
    });

    test("must generate DROP statement first and not execute", async () => {
        const sync = new Sync({ drop: true, tables: [TableA, TableB] });

        const dropSpy = sandbox.spy(TableA.getDriver(), "drop");
        const createSpy = sandbox.spy(TableA.getDriver(), "create");
        await sync.execute();
        expect(dropSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(dropSpy.getCall(1).args[1]).toEqual({});
        expect(dropSpy.getCall(2).args[1]).toEqual({ returnSQL: true });
        expect(dropSpy.getCall(3).args[1]).toEqual({});
        expect(dropSpy.callCount).toEqual(4);

        expect(createSpy.getCall(0).args[1]).toEqual({ returnSQL: true });
        expect(createSpy.getCall(1).args[1]).toEqual({});
        expect(createSpy.getCall(2).args[1]).toEqual({ returnSQL: true });
        expect(createSpy.getCall(3).args[1]).toEqual({});
        expect(createSpy.callCount).toEqual(4);
    });

    test("should log a warning - no tables passed", async () => {
        const sync = new Sync();

        await sync.execute();
        const log = sync.getLog();
        expect(log.length).toBe(1);
        expect(log[0].tags.includes("warning")).toEqual(true);
    });

    test("must log errors", async () => {
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
        expect(log[4].tags.includes("error")).toBe(true);
        expect(log[4].data.error.message).toEqual("Error.");
    });

    test("must return all tables", async () => {
        const sync = new Sync({ tables: [TableA, TableB], execute: true });
        expect(sync.getTables()[0]).toEqual(TableA);
        expect(sync.getTables()[1]).toEqual(TableB);
    });
});
