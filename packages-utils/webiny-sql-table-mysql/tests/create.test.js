import { assert } from "chai";
import { UserTable } from "./tables";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("create table test", function() {
    afterEach(() => {
        sandbox.restore();
    });

    it("should create table correctly", async () => {
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
        await userTable.delete();
        createStub.restore();

        assert.deepEqual(sqlQueries, {
            create:
                "CREATE TABLE `Users` (\n\t`id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,\n\t`name` varchar(100),\n\t`type` enum('IT', 'Marketing', 'Animals'),\n\t`createdOn` datetime,\n\tPRIMARY KEY (`id`)\n)",
            drop: "DROP TABLE `Users`"
        });
    });
});
