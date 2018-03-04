import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";

describe("missing operator error test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators });
    });

    it("should throw an error because operator is not recognized", async () => {
        try {
            stmt.getWhere({ where: { name: "Test", $unknownOperator: { test: 123 } } });
        } catch (e) {
            assert.equal(e.message, "Invalid operator {$unknownOperator : [object Object]}.");
            return;
        }

        throw Error("Error should've been thrown.");
    });

    it("should again throw an error because operator is not recognized", async () => {
        try {
            stmt.getWhere({ where: { name: "Test", enabled: { $unknownOperator: 123 } } });
        } catch (e) {
            assert.equal(e.message, "Invalid operator {enabled : [object Object]}.");
            return;
        }

        throw Error("Error should've been thrown.");
    });
});
