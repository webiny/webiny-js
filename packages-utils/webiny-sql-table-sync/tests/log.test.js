// @flow
import { assert } from "chai";
import { Log, Sync } from "..";

describe("Log test", function() {
    it("must set/get data correctly", async () => {
        const log = new Log("Message.", "warning", { key: "value" });
        assert.equal(log.getMessage(), "Message.");
        assert.equal(log.getType(), "warning");
        assert.deepEqual(log.getData(), { key: "value" });
    });

    it("log methods must work with default values", async () => {
        const sync = new Sync();
        sync.logInfo();
        sync.logWarning();
        sync.logError();
        sync.logSuccess();
        sync.__log(undefined, "warning");

        const log = sync.getLog();
        assert.equal(log[0].type, "info");
        assert.equal(log[1].type, "warning");
        assert.equal(log[2].type, "error");
        assert.equal(log[3].type, "success");
        assert.equal(log[4].type, "warning");
    });
});
