import { assert } from "chai";
import UserTable from "./tables/user.table";
import { IntColumn, CharColumn } from "./tables/customDriver/columns";
import { PrimaryIndex, UniqueIndex } from "./tables/customDriver/indexes";

describe("columns and indexes test", function() {
    it("should return columns and its properties correctly", async () => {
        const user = new UserTable();
        assert.instanceOf(user.getColumn("id"), IntColumn);
        assert.isTrue(user.getColumn("id").getUnsigned());
        assert.isTrue(user.getColumn("id").getAutoIncrement());

        assert.isFalse(user.getColumn("total").getUnsigned());
        user.getColumn("total").setAutoIncrement(false);
        assert.isFalse(user.getColumn("total").getAutoIncrement());

        assert.isTrue(user.getColumn("totalViews").getUnsigned());
        user.getColumn("totalViews").setUnsigned(true);
        assert.isTrue(user.getColumn("totalViews").getUnsigned());

        assert.instanceOf(user.getColumn("name"), CharColumn);
    });

    it("should return undefined because of an invalid column name", async () => {
        const user = new UserTable();
        assert.isUndefined(user.getColumn("id123"));
    });

    it("should return all columns", async () => {
        const user = new UserTable();
        assert.lengthOf(Object.keys(user.getColumns()), 4);
    });

    it("should return indexes correctly", async () => {
        const user = new UserTable();
        assert.instanceOf(user.getIndex("id"), PrimaryIndex);
        assert.instanceOf(user.getIndex("name"), UniqueIndex);
    });

    it("should return undefined because of an invalid index name", async () => {
        const user = new UserTable();
        assert.isUndefined(user.getIndex("id123"));
    });

    it("should return all indexes", async () => {
        const user = new UserTable();
        assert.lengthOf(Object.keys(user.getIndexes()), 3);
    });
});
