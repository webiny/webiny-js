import { sqlGenerator } from "./..";

describe("missing operation error test", function() {
    it("should throw an error because operation does not exist", async () => {
        try {
            sqlGenerator.build({
                operation: "unknown-command",
                table: "TestTable",
                where: { name: "Test", $unknownOperator: { test: 123 } }
            });
        } catch (e) {
            return;
        }

        throw Error(`Error should've been thrown.`);
    });
});
