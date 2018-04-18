import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("regular and $eq equality comparison operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("if array of values was passed, must use the IN operator", () => {
        const output = stmt.getWhere({ where: { firstName: ["John", "doe", 1, 2, 3] } });
        assert.equal(output, ` WHERE (\`firstName\` IN('John', 'doe', 1, 2, 3))`);
    });

    it("if values were passed with $in operator, must use the IN operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $in: ["John", "doe", 1, 2, 3] } } });
        assert.equal(output, ` WHERE (\`firstName\` IN('John', 'doe', 1, 2, 3))`);
    });
});
