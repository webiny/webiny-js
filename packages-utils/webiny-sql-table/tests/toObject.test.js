import { assert } from "chai";
import UserTable from "./tables/user.table";
import CustomDriver from "./tables/customDriver";

describe("toObject test", function() {
    it("should return object representation of table", async () => {
        const user = new UserTable();

        assert.deepEqual(user.toObject(), {
            autoIncrement: null,
            name: null,
            comment: null,
            engine: null,
            collate: null,
            defaultCharset: null,
            columns: [
                {
                    name: "id",
                    type: "INT",
                    default: null,
                    allowNull: true,
                    autoIncrement: true,
                    unsigned: true,
                    size: 5
                },
                {
                    name: "total",
                    type: "INT",
                    default: null,
                    allowNull: true,
                    autoIncrement: false,
                    unsigned: false,
                    size: 6
                },
                {
                    name: "totalViews",
                    type: "INT",
                    default: null,
                    allowNull: true,
                    autoIncrement: true,
                    unsigned: true,
                    size: 7
                },
                {
                    name: "name",
                    type: "CHAR",
                    default: null,
                    allowNull: true,
                    size: 8
                }
            ],
            indexes: [
                {
                    columns: null,
                    name: "id",
                    type: "PRIMARY"
                },
                {
                    columns: null,
                    name: "name",
                    type: "UNIQUE"
                }
            ]
        });
    });
});
