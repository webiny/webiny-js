import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("regular and $eq equality comparison operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("should generate correct statement using regular equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: "John" } });
        assert.equal(output, ` WHERE (\`firstName\` = 'John')`);
    });

    it("should generate correct statement using $eq equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $eq: "John" } } });
        assert.equal(output, ` WHERE (\`firstName\` = 'John')`);
    });

    it("should generate IS NULL", () => {
        const output = stmt.getWhere({ where: { firstName: { $eq: "John" } } });
        assert.equal(output, ` WHERE (\`firstName\` = 'John')`);
    });
});
