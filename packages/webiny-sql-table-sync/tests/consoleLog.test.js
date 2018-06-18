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

        const syncStub = sandbox.stub(ConsoleLog, "output").callsFake(() => {});
        await sync.execute();
        assert.equal(syncStub.callCount, 10);
    });

    it("must return type and colors correctly", async () => {
        assert.equal(ConsoleLog.__getColorFromType("error"), ConsoleLog.COLOR_ERROR);
        assert.equal(ConsoleLog.__getColorFromType("warning"), ConsoleLog.COLOR_WARNING);
        assert.equal(ConsoleLog.__getColorFromType("success"), ConsoleLog.COLOR_SUCCESS);
        assert.equal(ConsoleLog.__getColorFromType("info"), ConsoleLog.COLOR_INFO);
        assert.equal(ConsoleLog.__getColorFromType("___"), ConsoleLog.COLOR_DEFAULT);
    });

    it("must return correct type from tags", async () => {
        assert.equal(ConsoleLog.__getTypeFromTags(["a", "error", "b"]), "error");
        assert.equal(ConsoleLog.__getTypeFromTags(["a", "warning", "b"]), "warning");
        assert.equal(ConsoleLog.__getTypeFromTags(["a", "success", "b"]), "success");
        assert.equal(ConsoleLog.__getTypeFromTags(["a", "info", "b"]), "info");
        assert.equal(ConsoleLog.__getTypeFromTags(["a", "___", "b"]), "");
    });

    it("must output messages correctly", async () => {
        let currentMessage = null;
        const logStub = sandbox
            .stub(console, "log")
            .callsFake(message => (currentMessage = message));

        ConsoleLog.output("Test", {}, []);
        assert.equal(currentMessage, "Test");
        logStub.restore();
    });
});
