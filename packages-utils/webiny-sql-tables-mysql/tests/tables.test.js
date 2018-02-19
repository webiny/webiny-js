import { assert } from "chai";
import { UserTable, CompanyTable, ComplexTable } from "./tables";

describe("Table class test", function() {
    it("should return basic toJSON correctly", async () => {
        const userTable = new UserTable();
        const companyTable = new CompanyTable();
    });

    it("should return complex toJSON correctly", async () => {
        const userTable = new ComplexTable();

        console.log(userTable.toJSON());
        const JSON = {
            name: "TestTable",
            engine: "InnoDB",
            defaultCharset: "utf8",
            autoIncrement: 50,
            comment: "Nice test table...",
            collate: "utf888",
            columns: {
                id: {
                    type: "bigint",
                    length: 20,
                    unsigned: true,
                    notNull: true,
                    autoIncrement: true
                },
                iso: {
                    type: "char",
                    length: 2,
                    notNull: true
                },
                iso3: {
                    type: "char",
                    length: 3,
                    notNull: true
                },
                name: {
                    type: "varchar",
                    length: 80
                },
                label: {
                    type: "varchar",
                    length: 160,
                    default: "Missing label."
                },
                numcode: {
                    type: "smallint",
                    length: 6,
                    default: 100
                },
                type: {
                    type: "enum",
                    params: ["active", "inactive", "pending", "disabled"],
                    default: "pending"
                },
                description: {
                    type: "text"
                }
            },
            indexes: {
                idIndex: {
                    type: "primary",
                    column: "id"
                },
                isoIndex: {
                    type: "unique",
                    column: "iso"
                },
                isoIso3Index: {
                    type: "unique",
                    columns: ["iso", "iso3"]
                },
                labelIndex: {
                    column: "label"
                },
                typeIndex: {
                    column: "type",
                    type: "key"
                },
                descriptionFullText: {
                    column: "type",
                    type: "fullText"
                },
                realField: {}
            }
        };

        // TODO: Finish!
        // assert.equal(userTable.toJSON(), JSON)
    });
});
