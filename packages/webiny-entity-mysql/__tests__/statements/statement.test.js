import { Statement } from "webiny-entity-mysql/statements";
import { operators } from "webiny-entity-mysql";

describe("INSERT statement test", () => {
    test("should generate an INSERT statement", async () => {
        const sql = new Statement({
            operation: "insert",
            operators,
            table: "TestTable",
            data: { name: "Test", enabled: 1 }
        }).generate();

        expect(sql).toEqual(``);
    });

    test("should assign empty object as a default value", async () => {
        const statement = new Statement();
        expect(statement.options).toEqual({});
    });
});
