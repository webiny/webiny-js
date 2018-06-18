import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$search operator test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should generate LIKE statements, connected with OR operator", () => {
        const sql = ` WHERE ((\`firstName\` LIKE '%adr%' OR \`lastName\` LIKE '%adr%' OR \`email\` LIKE '%adr%'))`;
        let output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr"
                }
            }
        });
        expect(output).toEqual(sql);

        output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr",
                    operator: "or"
                }
            }
        });
        expect(output).toEqual(sql);
    });

    test("should generate LIKE statements, connected with AND operator", () => {
        let output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr",
                    operator: "and"
                }
            }
        });
        expect(output).toEqual(
            ` WHERE ((\`firstName\` LIKE '%adr%' AND \`lastName\` LIKE '%adr%' AND \`email\` LIKE '%adr%'))`
        );
    });
});
