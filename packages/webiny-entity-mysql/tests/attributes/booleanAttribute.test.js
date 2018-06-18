import Entity from "./../entities/entity";
class BooleanEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("enabled").boolean();
    }
}

BooleanEntity.classId = "BooleanEntity";

describe("boolean attribute test", () => {
    test("must return boolean, as 1 or 0, or value if value is not boolean (eg. null)", async () => {
        const entity = new BooleanEntity();
        entity.name = "Test";
        entity.enabled = true;

        let data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            enabled: 1
        });

        entity.enabled = false;

        data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            enabled: 0
        });

        entity.enabled = null;
        data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            enabled: null
        });
    });

    test("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new BooleanEntity();

        const attribute = entity.getAttribute("enabled");
        attribute.setStorageValue(0);
        expect(entity.enabled).toEqual(false);
        expect(attribute.value.isDirty()).toBe(false);
        expect(attribute.value.isSet()).toBe(true);

        attribute.setStorageValue(1);
        expect(entity.enabled).toEqual(true);
        expect(attribute.value.isDirty()).toBe(false);
        expect(attribute.value.isSet()).toBe(true);

        attribute.setStorageValue(null);
        expect(entity.enabled).toEqual(null);
        expect(attribute.value.isDirty()).toBe(false);
        expect(attribute.value.isSet()).toBe(true);
    });
});
