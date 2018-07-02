import { operators } from "webiny-entity-mysql";
import Statement from "webiny-entity-mysql/statements/statement";
import { Entity } from "webiny-entity";

describe("missing operator error test", () => {
    let stmt;

    beforeAll(() => {
        stmt = new Statement({ operators }, Entity);
    });

    test("should throw an error because operator is not recognized", async () => {
        try {
            stmt.getWhere({ where: { name: "Test", $unknownOperator: { test: 123 } } });
        } catch (e) {
            expect(e.message).toEqual("Invalid operator {$unknownOperator : [object Object]}.");
            return;
        }

        throw Error("Error should've been thrown.");
    });

    test("should again throw an error because operator is not recognized", async () => {
        try {
            stmt.getWhere({ where: { name: "Test", enabled: { $unknownOperator: 123 } } });
        } catch (e) {
            expect(e.message).toEqual("Invalid operator {enabled : [object Object]}.");
            return;
        }

        throw Error("Error should've been thrown.");
    });
});
