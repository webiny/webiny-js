// @flow
import { assert } from "chai";
import sinon from "sinon";
import { Sync } from "./..";
import { TableA, TableB } from "./tables";
import { ConsoleLog } from "..";

const sandbox = sinon.sandbox.create();

describe("ConsoleLog test", function() {
    afterEach(() => sandbox.restore());
    it("must use the ConsoleLog class (instead of plain Log)", async () => {
        const sync = new Sync({
            tables: [TableA, TableB],
            logClass: ConsoleLog
        });

        const syncSpy = sandbox.spy(ConsoleLog, "output");
        await sync.execute();
        assert.equal(syncSpy.callCount, 10);
    });
});
