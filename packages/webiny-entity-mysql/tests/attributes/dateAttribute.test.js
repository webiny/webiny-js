import Entity from "./../entities/entity";
class DateEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("createdOn").date();
    }
}

DateEntity.classId = "DateEntity";

describe("date attribute test", () => {
    test("must return YYYY-MM-DD hh:mm:ss format when sending Date to storage", async () => {
        const entity = new DateEntity();
        entity.name = "Test";
        entity.createdOn = new Date(2000, 0, 1, 0);

        const data = await entity.toStorage();
        expect(data.name).toEqual("Test");
        expect(data.createdOn).toEqual("2000-01-01 00:00:00");
    });

    test("must populate the attribute correctly using date string", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: "2018-01-02 13:08:55" });
        expect(entity.name).toEqual("Test");
        expect(entity.createdOn).toBeInstanceOf(Date);
    });

    test("must populate the attribute correctly using Date object", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: new Date(2000, 0, 1, 0) });
        expect(entity.name).toEqual("Test");
        expect(entity.createdOn).toBeInstanceOf(Date);
    });

    test("must not be dirty when storage value is set", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: new Date(2000, 0, 1, 0) });
        expect(entity.getAttribute("createdOn").value.isDirty()).toBe(false);
    });

    test("must return null when sending to storage", async () => {
        const entity = new DateEntity();
        entity.name = "Test";

        const data = await entity.toStorage();
        expect(data.name).toEqual("Test");
        expect(data.createdOn).toBeNil();
    });

    test("must populate the attribute correctly with null value", async () => {
        const entity = new DateEntity();
        entity.populateFromStorage({ name: "Test", createdOn: null });
        expect(entity.name).toEqual("Test");
        expect(entity.createdOn).toBeNull();
    });

    test("must return value if not instance of Date", async () => {
        const entity = new DateEntity();
        entity.createdOn = new Date();
        expect(entity.createdOn).toBeInstanceOf(Date);

        entity.createdOn = null;
        expect(await entity.getAttribute("createdOn").getStorageValue()).toBeNull();
    });
});
