import { assert } from "chai";
import { CreateTable } from "./..";

describe("INSERT statement test", function() {
    it("should generate an INSERT statement", async () => {
        const sql = new CreateTable({
            name: "TestTable",
            engine: "InnoDB",
            defaultCharset: "utf8",
            autoIncrement: 50,
            comment: "Nice test table...",
            collate: "utf888",
            columns: [
                {
                    name: "id",
                    type: "bigint",
                    size: 20,
                    unsigned: true,
                    notNull: true,
                    autoIncrement: true
                },
                {
                    name: "iso",
                    type: "char",
                    size: 2,
                    notNull: true
                },
                {
                    name: "iso3",
                    type: "char",
                    size: 3,
                    notNull: true
                },
                {
                    name: "name",
                    type: "varchar",
                    size: 80
                },
                {
                    name: "label",
                    type: "varchar",
                    size: 160,
                    default: "Missing label."
                },
                {
                    name: "numcode",
                    type: "smallint",
                    size: 6,
                    default: 100
                },
                {
                    name: "type",
                    type: "enum",
                    params: ["active", "inactive", "pending", "disabled"],
                    default: "pending"
                },
                {
                    name: "description",
                    type: "text"
                }
            ],
            indexes: [
                {
                    name: "idIndex",
                    type: "primary",
                    column: "id"
                },
                {
                    name: "isoIndex",
                    type: "unique",
                    column: "iso"
                },
                {
                    name: "isoIso3Index",
                    type: "unique",
                    columns: ["iso", "iso3"]
                },
                {
                    name: "labelIndex",
                    column: "label"
                },
                {
                    name: "typeIndex",
                    column: "type",
                    type: "key"
                },
                {
                    name: "descriptionFullText",
                    column: "type",
                    type: "fullText"
                },
                {
                    name: "realField"
                }
            ]
        }).generate();

        assert.equal(
            sql,
            `CREATE TABLE \`TestTable\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
	\`iso\` char(2) NOT NULL,
	\`iso3\` char(3) NOT NULL,
	\`name\` varchar(80),
	\`label\` varchar(160) DEFAULT 'Missing label.',
	\`numcode\` smallint(6) DEFAULT '100',
	\`type\` enum(active, inactive, pending, disabled) DEFAULT 'pending',
	\`description\` text,
	PRIMARY KEY  (\`id\`),
	UNIQUE KEY isoIndex (\`iso\`),
	UNIQUE KEY isoIso3Index (\`iso\`, \`iso3\`),
	KEY labelIndex (\`label\`),
	KEY typeIndex (\`type\`),
	FULLTEXT KEY descriptionFullText (\`type\`),
	KEY realField (\`realField\`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf888 COMMENT="Nice test table..."`
        );
    });

    it("should correctly gnenerate CREATE TABLE statement without additional params", async () => {
        const sql = new CreateTable({
            name: "TestTable",
            columns: [
                {
                    name: "id",
                    type: "bigint",
                    size: 20,
                    unsigned: true,
                    notNull: true,
                    autoIncrement: true
                }
            ]
        }).generate();

        assert.equal(
            sql,
            `CREATE TABLE \`TestTable\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT
)`
        );
    });
});
