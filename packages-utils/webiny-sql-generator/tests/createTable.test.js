import { assert } from "chai";
import queryBuilder from "./../src";

describe("INSERT statement test", function() {
    it("should generate an INSERT statement", async () => {
        const sql = queryBuilder.createTable({
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
        });

        console.log(sql);
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
	UNIQUE KEY isoIso3Index (\`iso, iso3\`),
	KEY labelIndex (\`label\`),
	KEY typeIndex (\`type\`),
	FULLTEXT KEY descriptionFullText (\`type\`),
	KEY realField (\`realField\`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8 COLLATE=utf888 COMMENT="Nice test table..."`
        );
    });

    it("should correctly gnenerate CREATE TABLE statement without additional params", async () => {
        const sql = queryBuilder.createTable({
            name: "TestTable",
            columns: {
                id: {
                    type: "bigint",
                    length: 20,
                    unsigned: true,
                    notNull: true,
                    autoIncrement: true
                }
            }
        });

        assert.equal(
            sql,
            `CREATE TABLE \`TestTable\` (
	\`id\` bigint(20) unsigned NOT NULL AUTO_INCREMENT
)`
        );
    });
});
