import { assert } from "chai";
import UserTable from "./tables/user.table";
import { IntColumn, CharColumn } from "./tables/customDriver/columns";
import { PrimaryIndex, UniqueIndex } from "./tables/customDriver/indexes";

describe("columns and indexes test", function() {
    it("should have columns set correctly", async () => {
        const user = new UserTable();
        assert.instanceOf(user.getColumn("id"), IntColumn);
        assert.isTrue(user.getColumn("id").getUnsigned());
        assert.isTrue(user.getColumn("id").getAutoIncrement());

        assert.isFalse(user.getColumn("total").getUnsigned());
        assert.isFalse(user.getColumn("total").getAutoIncrement());

        assert.isTrue(user.getColumn("totalViews").getUnsigned());
        assert.isTrue(user.getColumn("totalViews").getAutoIncrement());

        assert.instanceOf(user.getColumn("name"), CharColumn);
    });

    it("should have indexes set correctly", async () => {
        const user = new UserTable();
        assert.instanceOf(user.getIndex("id"), PrimaryIndex);
        assert.instanceOf(user.getIndex("name"), UniqueIndex);
    });
});
