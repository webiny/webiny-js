import { Update } from "../../src/statements";
import { operators } from "../../src";
import { Entity } from "webiny-entity";

describe("UPDATE statement test", () => {
    test("should generate an UPDATE statement", () => {
        const sql = new Update(
            {
                operation: "update",
                operators,
                table: "TestTable",
                data: { name: "Test", enabled: 1 }
            },
            Entity
        ).generate();

        expect(sql).toEqual("UPDATE `TestTable` SET `name` = 'Test', `enabled` = 1");
    });

    test("should generate an UPDATE statement and preserve false in query", () => {
        const sql = new Update(
            {
                operation: "update",
                operators,
                table: "TestTable",
                data: { name: "Test", enabled: false }
            },
            Entity
        ).generate();

        expect(sql).toEqual("UPDATE `TestTable` SET `name` = 'Test', `enabled` = false");
    });

    test("should generate an UPDATE statement with additional conditions", () => {
        const sql = new Update(
            {
                operation: "update",
                operators,
                table: "TestTable",
                data: { name: "Test", enabled: false },
                where: { $or: { age: 30, deletedOn: { $ne: null } } }
            },
            Entity
        ).generate();

        expect(sql).toEqual(
            "UPDATE `TestTable` SET `name` = 'Test', `enabled` = false WHERE ((`age` = 30 OR `deletedOn` IS NOT NULL))"
        );
    });
});
