import Entity from "./../entities/entity";
import { Model } from "webiny-model";

class CustomModel extends Model {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("age").integer();
    }
}

class ModelEntity extends Entity {
    constructor() {
        super();
        this.attr("name").char();
        this.attr("customModel").model(CustomModel);
    }
}

ModelEntity.classId = "BooleanEntity";

describe("model attribute test", () => {
    test("it must return JSON string as storage value", async () => {
        const entity = new ModelEntity();
        entity.populate({ name: "Test-1", customModel: { name: "test", age: 33 } });

        expect(await entity.customModel).toBeInstanceOf(CustomModel);

        const data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test-1",
            customModel: '{"name":"test","age":33}'
        });
    });

    test("it must return value itself if it's missing (eg. null)", async () => {
        const entity = new ModelEntity();
        entity.populate({ name: "Test-1" });
        entity.getAttribute("customModel").value.dirty = true;

        const data = await entity.toStorage();
        expect(data).toEqual({
            name: "Test-1",
            customModel: null
        });
    });

    test("once received from storage, value should be converted to a plain object, otherwise nothing should be set", async () => {
        const entity = new ModelEntity();
        entity.populateFromStorage({
            name: "Test-1",
            customModel: '{"name":"test","age":33}'
        });

        expect(await entity.toJSON("name,customModel[name,age]")).toEqual({
            id: null,
            name: "Test-1",
            customModel: {
                name: "test",
                age: 33
            }
        });
        expect(entity.isClean()).toBe(true);

        entity.populateFromStorage({
            name: "Test-1",
            customModel: null
        });

        expect(entity.isClean()).toBe(true);
    });

    test("should be able to assign value from one another entity's model attribute to other entity", async () => {
        const entity1 = new ModelEntity();

        const entity2 = new ModelEntity();
        entity2.name = "entity2";
        entity2.customModel = { name: "test", age: 30 };

        expect(await entity2.toJSON("name,customModel[name,age]")).toEqual({
            id: null,
            name: "entity2",
            customModel: {
                name: "test",
                age: 30
            }
        });

        entity2.getModel().clean();

        entity1.customModel = entity2.customModel;

        const data = await entity1.toStorage();
        expect(data).toEqual({
            customModel: '{"name":"test","age":30}'
        });
    });

    test("should be able to assign value from one entity's models attribute to other entity (from storage test)", async () => {
        const entity1 = new ModelEntity();
        entity1.populateFromStorage({ name: "entity1" });

        const entity2 = new ModelEntity();
        entity2.populateFromStorage({ name: "entity1", customModel: '{"name":"test","age":30}' });

        entity1.customModel = entity2.customModel;

        const data = await entity1.toStorage();
        expect(data).toEqual({
            customModel: '{"name":"test","age":30}'
        });
    });
});
