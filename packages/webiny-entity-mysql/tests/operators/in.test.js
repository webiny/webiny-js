import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("regular and $eq equality comparison operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("if array of values was passed, must use the IN operator", () => {
        const output = stmt.getWhere({ where: { firstName: ["John", "doe", 1, 2, 3] } });
        expect(output).toEqual(` WHERE (\`firstName\` IN('John', 'doe', 1, 2, 3))`);
    });

    test("if values were passed with $in operator, must use the IN operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $in: ["John", "doe", 1, 2, 3] } } });
        expect(output).toEqual(` WHERE (\`firstName\` IN('John', 'doe', 1, 2, 3))`);
    });
});
