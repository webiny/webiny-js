import { assert } from "chai";
import UserTable from "./tables/user.table";
import CustomDriver from "./tables/customDriver";

describe("toObject test", function() {
    it("should return object representation of table", async () => {
        const user = new UserTable();

        assert.deepEqual(user.toObject(), {
            columns: [
                {
                    autoIncrement: true,
                    name: "id",
                    size: 5,
                    type: "INT",
                    unsigned: true
                },
                {
                    autoIncrement: false,
                    name: "total",
                    size: 6,
                    type: "INT",
                    unsigned: false
                },
                {
                    autoIncrement: true,
                    name: "totalViews",
                    size: 7,
                    type: "INT",
                    unsigned: true
                },
                {
                    name: "name",
                    size: 8,
                    type: "CHAR"
                }
            ],
            indexes: [
                {
                    name: "id",
                    type: "PRIMARY"
                },
                {
                    name: "name",
                    type: "UNIQUE"
                }
            ]
        });
    });
});
