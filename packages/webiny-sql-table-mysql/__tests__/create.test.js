import { UserTable, userTableSql, Table } from "./tables";
import sinon from "sinon";
import mysql from "mysql";
import { Table as BaseTable } from "webiny-sql-table";
import { MySQLDriver } from "webiny-sql-table-mysql";

const sandbox = sinon.sandbox.create();

describe("create table test", () => {
    afterEach(() => {
        sandbox.restore();
    });

    test("should create table correctly", async () => {
        const userTable = new UserTable();

        const sqlQueries = {
            create: "",
            drop: ""
        };

        const createStub = sandbox
            .stub(userTable.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(sql => {
                sqlQueries.create = sql;
            })
            .onCall(1)
            .callsFake(sql => {
                sqlQueries.drop = sql;
            });

        await userTable.create();
        await userTable.drop();
        createStub.restore();

        expect(sqlQueries).toEqual({
            create: userTableSql,
            drop: "DROP TABLE IF EXISTS `Users`;"
        });
    });

    test("should create without extra table parameters", async () => {
        class MySQLTable extends BaseTable {}

        MySQLTable.setDriver(
            new MySQLDriver({
                connection: mysql.createConnection({})
            })
        );

        MySQLTable.tableName = "blankTable";

        const blankTable = new MySQLTable();
        const sqlQueries = {
            create: "",
            drop: ""
        };

        const createStub = sandbox
            .stub(blankTable.getDriver().getConnection(), "query")
            .onCall(0)
            .callsFake(sql => {
                sqlQueries.create = sql;
            })
            .onCall(1)
            .callsFake(sql => {
                sqlQueries.drop = sql;
            });

        await blankTable.create();
        await blankTable.drop();
        createStub.restore();

        expect(sqlQueries).toEqual({
            create: "CREATE TABLE `blankTable` (\n\n);",
            drop: "DROP TABLE IF EXISTS `blankTable`;"
        });
    });

    test("should return only SQL when setting returnSQL option to true", async () => {
        const userTable = new UserTable();
        const sql = await userTable.create({ returnSQL: true });
        expect(
            "CREATE TABLE `Users` (\n" +
                "\t`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n" +
                "\t`name` varchar(100),\n" +
                "\t`default` varchar(100) DEFAULT NULL,\n" +
                "\t`enabled` tinyint DEFAULT 'false',\n" +
                "\t`age` tinyint DEFAULT 50,\n" +
                "\t`type` enum('IT', 'Marketing', 'Animals'),\n" +
                "\t`createdOn` datetime,\n" +
                "\t`meta` json,\n" +
                "\tPRIMARY KEY (`id`)\n" +
                ") ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Main Users table...';"
        ).toEqual(sql);
    });
});
