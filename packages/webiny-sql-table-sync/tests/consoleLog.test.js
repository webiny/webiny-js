// @flow
import sinon from "sinon";
import { Sync } from "./..";
import { TableA, TableB } from "./tables";
import { ConsoleLog } from "..";

const sandbox = sinon.sandbox.create();

describe("ConsoleLog test", () => {
    afterEach(() => sandbox.restore());
    test("must use the ConsoleLog class (instead of plain Log)", async () => {
        const sync = new Sync({
            tables: [TableA, TableB],
            logClass: ConsoleLog
        });

        const syncStub = sandbox.stub(ConsoleLog, "output").callsFake(() => {});
        await sync.execute();
        expect(syncStub.callCount).toEqual(10);
    });

    test("must return type and colors correctly", async () => {
        expect(ConsoleLog.__getColorFromType("error")).toEqual(ConsoleLog.COLOR_ERROR);
        expect(ConsoleLog.__getColorFromType("warning")).toEqual(ConsoleLog.COLOR_WARNING);
        expect(ConsoleLog.__getColorFromType("success")).toEqual(ConsoleLog.COLOR_SUCCESS);
        expect(ConsoleLog.__getColorFromType("info")).toEqual(ConsoleLog.COLOR_INFO);
        expect(ConsoleLog.__getColorFromType("___")).toEqual(ConsoleLog.COLOR_DEFAULT);
    });

    test("must return correct type from tags", async () => {
        expect(ConsoleLog.__getTypeFromTags(["a", "error", "b"])).toEqual("error");
        expect(ConsoleLog.__getTypeFromTags(["a", "warning", "b"])).toEqual("warning");
        expect(ConsoleLog.__getTypeFromTags(["a", "success", "b"])).toEqual("success");
        expect(ConsoleLog.__getTypeFromTags(["a", "info", "b"])).toEqual("info");
        expect(ConsoleLog.__getTypeFromTags(["a", "___", "b"])).toBe("");
    });

    test("must output messages correctly", async () => {
        let currentMessage = null;
        const logStub = sandbox
            .stub(console, "log")
            .callsFake(message => (currentMessage = message));

        ConsoleLog.output("Test", {}, []);
        expect(currentMessage).toEqual("Test");
        logStub.restore();
    });
});
