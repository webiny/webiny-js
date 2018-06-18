import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("regular and $ne equality comparison operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct statement using $ne equality operator", () => {
        const output = stmt.getWhere({ where: { firstName: { $ne: "John" } } });
        expect(output).toEqual(` WHERE (\`firstName\` <> 'John')`);
    });

    test("should generate IS NULL", () => {
        const output = stmt.getWhere({ where: { deletedOn: { $ne: null } } });
        expect(output).toEqual(` WHERE (\`deletedOn\` IS NOT NULL)`);
    });
});
