import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$lte operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct statement using $lte equality operator", () => {
        const output = stmt.getWhere({ where: { age: { $lte: 30 } } });
        expect(output).toEqual(` WHERE (\`age\` <= 30)`);
    });

    test("should generate NULL - no conversion to number should be made", () => {
        const output = stmt.getWhere({ where: { age: { $lte: null } } });
        expect(output).toEqual(` WHERE (\`age\` <= NULL)`);
    });
});
