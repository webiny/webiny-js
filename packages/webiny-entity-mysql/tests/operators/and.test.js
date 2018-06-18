import Statement from "../../src/statements/statement";
import { operators } from "../../src";
import { Entity } from "webiny-entity";

describe("$and logical operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate correct statement", () => {
        const output = stmt.getWhere({ where: { firstName: "John", lastName: "Doe", age: 35 } });
        expect(output).toEqual(
            ` WHERE (\`firstName\` = 'John' AND \`lastName\` = 'Doe' AND \`age\` = 35)`
        );
    });

    test("should generate correct statement with nested $and operators", () => {
        const output = stmt.getWhere({
            where: {
                firstName: "John",
                lastName: "Doe",
                $and: { age: 35, height: 6.2, weight: 225 }
            }
        });
        expect(output).toEqual(
            ` WHERE (\`firstName\` = 'John' AND \`lastName\` = 'Doe' AND (\`age\` = 35 AND \`height\` = 6.2 AND \`weight\` = 225))`
        );
    });

    test("should throw Error because values are in invalid format", () => {
        expect(() => {
            stmt.getWhere({
                where: {
                    $or: {
                        firstName: "John",
                        lastName: "Doe",
                        $and: "*** THIS IS AN INVALID FORMAT ***"
                    }
                }
            });
        }).toThrow();
    });

    test("should generate correct statement with nested $and operators but with values in an array", () => {
        const output = stmt.getWhere({
            where: {
                firstName: "John",
                lastName: "Doe",
                $and: [{ age: 35 }, { age: 50 }, { height: 6.2, weight: 225 }]
            }
        });

        expect(output).toEqual(
            ` WHERE (\`firstName\` = 'John' AND \`lastName\` = 'Doe' AND (\`age\` = 35 AND \`age\` = 50 AND \`height\` = 6.2 AND \`weight\` = 225))`
        );
    });
});
