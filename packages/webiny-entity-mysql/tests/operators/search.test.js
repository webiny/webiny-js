import { assert } from "chai";
import { operators } from "../../src";
import Statement from "../../src/statements/statement";
import { Entity } from "webiny-entity";

describe("$search operator test", function() {
    let stmt;

    before(() => {
        stmt = new Statement({ operators }, Entity);
    });

    it("should generate LIKE statements, connected with OR operator", () => {
        const sql = ` WHERE ((firstName LIKE '%adr%' OR lastName LIKE '%adr%' OR email LIKE '%adr%'))`;
        let output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr"
                }
            }
        });
        assert.equal(output, sql);

        output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr",
                    operator: "or"
                }
            }
        });
        assert.equal(output, sql);
    });

    it("should generate LIKE statements, connected with AND operator", () => {
        let output = stmt.getWhere({
            where: {
                $search: {
                    columns: ["firstName", "lastName", "email"],
                    query: "adr",
                    operator: "and"
                }
            }
        });
        assert.equal(
            output,
            ` WHERE ((firstName LIKE '%adr%' AND lastName LIKE '%adr%' AND email LIKE '%adr%'))`
        );
    });
});
