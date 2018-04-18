import { assert } from "chai";

import Entity from "./../entities/entity";
class DateEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("createdOn").date();
    }
}

DateEntity.classId = "DateEntity";

describe("date attribute test", function() {
    it("must return YYYY-MM-DD hh:mm:ss format when sending Date to storage", async () => {
        const entity = new DateEntity();
        entity.name = "Test";
        entity.createdOn = new Date(2000, 0, 1, 0);

        const data = await entity.toStorage();
        assert.equal(data.name, "Test");
        assert.equal(data.createdOn, "2000-01-01 00:00:00");
    });

    it("must populate the attribute correctly using date string", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: "2018-01-02 13:08:55" });
        assert.equal(entity.name, "Test");
        assert.instanceOf(entity.createdOn, Date);
    });

    it("must populate the attribute correctly using Date object", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: new Date(2000, 0, 1, 0) });
        assert.equal(entity.name, "Test");
        assert.instanceOf(entity.createdOn, Date);
    });

    it("must not be dirty when storage value is set", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: new Date(2000, 0, 1, 0) });
        assert.isFalse(entity.getAttribute("createdOn").value.isDirty());
    });

    it("must return null when sending to storage", async () => {
        const entity = new DateEntity();
        entity.name = "Test";

        const data = await entity.toStorage();
        assert.equal(data.name, "Test");
        assert.equal(data.createdOn, null);
    });

    it("must populate the attribute correctly with null value", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: null });
        assert.equal(entity.name, "Test");
        assert.isNull(entity.createdOn);
    });

    it("must return value if not instance of Date", async () => {
        const entity = new DateEntity();
        entity.createdOn = new Date();
        assert.instanceOf(entity.createdOn, Date);

        entity.createdOn = null;
        assert.isNull(await entity.getAttribute("createdOn").getStorageValue());
    });
});
