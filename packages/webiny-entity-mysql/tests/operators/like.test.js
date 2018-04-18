import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$like operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("should generate correct LIKE statements", () => {
        let output = stmt.getWhere({ where: { firstName: { $like: "John" } } });
        assert.equal(output, ` WHERE (\`firstName\` LIKE 'John')`);

        output = stmt.getWhere({ where: { firstName: { $like: "%ohn" } } });
        assert.equal(output, ` WHERE (\`firstName\` LIKE '%ohn')`);

        output = stmt.getWhere({ where: { firstName: { $like: "%oh%" } } });
        assert.equal(output, ` WHERE (\`firstName\` LIKE '%oh%')`);
    });
});
