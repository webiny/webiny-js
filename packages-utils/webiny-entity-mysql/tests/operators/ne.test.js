import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";

describe("regular and $ne equality comparison operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators });
    });

    it("should generate correct statement using $ne equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $ne: "John" } } });
        assert.equal(output, ` WHERE (firstName <> 'John')`);
    });

    it("should generate IS NULL", () => {
        const output = stmt.getWhere({ where: { deletedOn: { $ne: null } } });
        assert.equal(output, ` WHERE (deletedOn IS NOT NULL)`);
    });
});
