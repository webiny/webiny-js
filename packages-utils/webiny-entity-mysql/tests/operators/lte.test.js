import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$lte operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("should generate correct statement using $lte equality operator", () => {
        const output = stmt.getWhere({ where: { age: { $lte: 30 } } });
        assert.equal(output, ` WHERE (age <= 30)`);
    });

    it("should generate NULL - no conversion to number should be made", () => {
        const output = stmt.getWhere({ where: { age: { $lte: null } } });
        assert.equal(output, ` WHERE (age <= NULL)`);
    });
});
