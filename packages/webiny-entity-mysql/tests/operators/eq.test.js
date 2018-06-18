import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("regular and $eq equality comparison operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct statement using regular equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: "John" } });
        expect(output).toEqual(` WHERE (\`firstName\` = 'John')`);
    });

    test("should generate correct statement using $eq equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $eq: "John" } } });
        expect(output).toEqual(` WHERE (\`firstName\` = 'John')`);
    });

    test("should generate IS NULL", () => {
        const output = stmt.getWhere({ where: { firstName: { $eq: "John" } } });
        expect(output).toEqual(` WHERE (\`firstName\` = 'John')`);
    });
});
