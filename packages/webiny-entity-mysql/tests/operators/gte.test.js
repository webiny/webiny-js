import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$gte operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct statement using $gte equality operator", () => {
        const output = stmt.getWhere({ where: { age: { $gte: 30 } } });
        expect(output).toEqual(` WHERE (\`age\` >= 30)`);
    });

    test("should generate NULL - no conversion to number should be made", () => {
        const output = stmt.getWhere({ where: { age: { $gte: null } } });
        expect(output).toEqual(` WHERE (\`age\` >= NULL)`);
    });
});
