import { assert } from "chai";
import { query } from "../src/index";

describe("missing operator error test", function() {
    it("should throw an error because operator is not recognized", async () => {
        try {
            query.process({ name: "Test", $unknownOperator: { test: 123 } });
        } catch (e) {
            assert.equal(e.message, "Invalid operator {$unknownOperator : [object Object]}.");
            return;
        }

        throw Error(`Error should've been thrown.`);
    });

    it("should again throw an error because operator is not recognized", async () => {
        try {
            query.process({ name: "Test", enabled: { $unknownOperator: 123 } });
        } catch (e) {
            assert.equal(e.message, `Invalid operator {enabled : [object Object]}.`);
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
