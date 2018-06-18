// @flow
import { assert } from "chai";
import { Log, Sync } from "..";

describe("Log test", function() {
    it("must set/get data correctly", async () => {
        const log = new Log("Message.", { key: "value" }, ["warning"]);
        assert.equal(log.getMessage(), "Message.");
        assert.isTrue(log.tags.includes("warning"));
        assert.deepEqual(log.getData(), { key: "value" });
    });

    it("must return tags", async () => {
        const log = new Log("Message.", { key: "value" }, ["warning"]);
        assert.deepEqual(log.getTags(), ["warning"]);
    });

    it("log methods must work with default values", async () => {
        const sync = new Sync();
        sync.logInfo();
        sync.logWarning();
        sync.logError();
        sync.logSuccess();
        sync.__log(undefined);

        const log = sync.getLog();
        assert.isTrue(log[0].tags.includes("info"));
        assert.isTrue(log[1].tags.includes("warning"));
        assert.isTrue(log[2].tags.includes("error"));
        assert.isTrue(log[3].tags.includes("success"));
        assert.isFalse(log[4].tags.includes("warning"));
    });
});
