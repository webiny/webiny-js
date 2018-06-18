import Entity from "./../entities/entity";

class ObjectEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("random").object();
    }
}

ObjectEntity.classId = "ObjectEntity";

describe("object attribute test", () => {
    test("must return object, as JSON string", async () => {
        const entity = new ObjectEntity();
        entity.name = "Test";
        entity.random = { a: 1, b: 2, c: "123", d: { x: 1, y: 5 } };

        let data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            random: '{"a":1,"b":2,"c":"123","d":{"x":1,"y":5}}'
        });

        entity.random = null;

        data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test",
            random: null
        });
    });

    test("must parse JSON string from storage, and must not set attribute as dirty", async () => {
        const entity = new ObjectEntity();
        entity.getAttribute("random").setStorageValue('["a","b","c"]');

        expect(entity.random).toEqual(["a", "b", "c"]);
        expect(entity.getAttribute("random").value.isDirty()).toBe(false);
        expect(entity.getAttribute("random").value.isSet()).toBe(true);

        entity.getAttribute("random").setStorageValue(null);
        expect(entity.random).toEqual(null);
        expect(entity.getAttribute("random").value.isDirty()).toBe(false);
        expect(entity.getAttribute("random").value.isSet()).toBe(true);
    });
});
