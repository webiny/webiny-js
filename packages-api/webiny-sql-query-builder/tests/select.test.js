import { assert } from "chai";

import queryBuilder from "./../src";

describe("SELECT statement test", function() {
    it("should generate a SELECT statement", async () => {
        const params = {
            operation: "select",
            table: "TestTable",
            where: { name: "Test", enabled: true, deletedOn: null },
            limit: 10,
            offset: 0,
            order: [["name", -1], ["createdOn", 1]]
        };

        let sql = queryBuilder.build(params);
        assert.equal(
            sql,
            `SELECT * FROM TestTable WHERE (name = 'Test' AND enabled = true AND deletedOn IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10`
        );

        params.columns = ["name", "enabled"];
        sql = queryBuilder.build(params);

        assert.equal(
            sql,
            `SELECT name, enabled FROM TestTable WHERE (name = 'Test' AND enabled = true AND deletedOn IS NULL) ORDER BY name DESC, createdOn ASC LIMIT 10`
        );
    });
});
