// @flow
import { Log, Sync } from "..";

describe("Log test", () => {
    test("must set/get data correctly", async () => {
        const log = new Log("Message.", { key: "value" }, ["warning"]);
        expect(log.getMessage()).toEqual("Message.");
        expect(log.tags.includes("warning")).toBe(true);
        expect(log.getData()).toEqual({ key: "value" });
    });

    test("must return tags", async () => {
        const log = new Log("Message.", { key: "value" }, ["warning"]);
        expect(log.getTags()).toEqual(["warning"]);
    });

    test("log methods must work with default values", async () => {
        const sync = new Sync();
        sync.logInfo();
        sync.logWarning();
        sync.logError();
        sync.logSuccess();
        sync.__log(undefined, "warning");

        const log = sync.getLog();
        expect(log[0].tags.includes("info")).toBe(true);
        expect(log[1].tags.includes("warning")).toBe(true);
        expect(log[2].tags.includes("error")).toBe(true);
        expect(log[3].tags.includes("success")).toBe(true);
        expect(log[4].tags.includes("warning")).toBe(false);
    });
});
