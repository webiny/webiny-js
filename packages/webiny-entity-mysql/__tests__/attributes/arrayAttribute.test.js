import Entity from "./../entities/entity";
class ArrayEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("tags").array();
    }
}

ArrayEntity.classId = "ArrayEntity";

describe("array attribute test", () => {
    test("must return array, as JSON string", async () => {
        const entity = new ArrayEntity();
        entity.name = "Test";
        entity.tags = ["a", "b", "c"];

        let data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            tags: '["a","b","c"]'
        });

        entity.tags = null;

        data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            tags: null
        });
    });

    test("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new ArrayEntity();
        entity.getAttribute("tags").setStorageValue('["a","b","c"]');

        expect(entity.tags).toEqual(["a", "b", "c"]);
        expect(entity.getAttribute("tags").value.isDirty()).toBe(false);
        expect(entity.getAttribute("tags").value.isSet()).toBe(true);

        entity.getAttribute("tags").setStorageValue(null);
        expect(entity.tags).toEqual(null);
        expect(entity.getAttribute("tags").value.isDirty()).toBe(false);
        expect(entity.getAttribute("tags").value.isSet()).toBe(true);
    });
});
