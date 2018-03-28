import { assert } from "chai";
import UserTable from "./tables/user.table";

describe("toObject test", function() {
    it("should return object representation of table", async () => {
        const userTable = new UserTable();

        assert.deepEqual(userTable.toObject(), {
            autoIncrement: null,
            name: "Users",
            comment: null,
            engine: null,
            collate: null,
            defaultCharset: null,
            columns: [
                {
                    name: "id",
                    type: "int",
                    autoIncrement: true,
                    unsigned: true,
                    arguments: [5]
                },
                {
                    name: "total",
                    type: "int",
                    autoIncrement: null,
                    unsigned: false,
                    arguments: [6]
                },
                {
                    name: "totalViews",
                    type: "int",
                    autoIncrement: null,
                    unsigned: true,
                    arguments: [7]
                },
                {
                    name: "name",
                    type: "char",
                    arguments: [8],
                    autoIncrement: null,
                    unsigned: null
                }
            ],
            indexes: [
                {
                    columns: ["id"],
                    name: null,
                    type: "PRIMARY"
                },
                {
                    columns: ["name"],
                    name: "name",
                    type: "UNIQUE"
                },
                {
                    columns: ["total", "totalViews"],
                    name: "totals",
                    type: "UNIQUE"
                },
                {
                    columns: ["name", "total", "totalViews"],
                    name: "name_total_totalViews",
                    type: "UNIQUE"
                }
            ]
        });
    });
});
