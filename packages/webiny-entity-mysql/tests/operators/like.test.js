import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$like operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct LIKE statements", () => {
        let output = stmt.getWhere({ where: { firstName: { $like: "John" } } });
        expect(output).toEqual(` WHERE (\`firstName\` LIKE 'John')`);

        output = stmt.getWhere({ where: { firstName: { $like: "%ohn" } } });
        expect(output).toEqual(` WHERE (\`firstName\` LIKE '%ohn')`);

        output = stmt.getWhere({ where: { firstName: { $like: "%oh%" } } });
        expect(output).toEqual(` WHERE (\`firstName\` LIKE '%oh%')`);
    });
});
