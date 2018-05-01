import { assert } from "chai";
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
        this.attr("customModels").models(CustomModel);
    }
}

ModelEntity.classId = "BooleanEntity";

describe("models attribute test", function() {
    it("it must return JSON string as storage value", async () => {
        const entity = new ModelEntity();
        entity.populate({
            name: "Test-1",
            customModels: [
                { name: "test", age: 30 },
                { name: "test2", age: 50 },
                { name: "test3", age: 100 }
            ]
        });

        assert.isArray(await entity.customModels);

        const data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test-1",
            customModels:
                '[{"name":"test","age":30},{"name":"test2","age":50},{"name":"test3","age":100}]'
        });
    });

    it("it must return value itself if it's missing (eg. null)", async () => {
        const entity = new ModelEntity();
        entity.populate({ name: "Test-1" });
        entity.getAttribute("customModels").value.dirty = false;

        const data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test-1"
        });
    });

    it("once received from storage, value should be converted to a plain object, otherwise nothing should be set", async () => {
        const entity = new ModelEntity();
        entity.populateFromStorage({
            name: "Test-1",
            customModels:
                '[{"name":"test","age":30},{"name":"test2","age":50},{"name":"test3","age":100}]'
        });

        assert.deepEqual(await entity.toJSON("name,customModels[name,age]"), {
            id: null,
            name: "Test-1",
            customModels: [
                {
                    name: "test",
                    age: 30
                },
                {
                    name: "test2",
                    age: 50
                },
                {
                    name: "test3",
                    age: 100
                }
            ]
        });
        assert.isTrue(entity.isClean());

        entity.populateFromStorage({
            name: "Test-1",
            customModel: null
        });

        assert.isTrue(entity.isClean());
    });

    it("should be able to assign value from one entity's models attribute to other entity", async () => {
        const entity1 = new ModelEntity();

        const entity2 = new ModelEntity();
        entity2.name = "entity2";
        entity2.customModels = [
            { name: "test", age: 30 },
            { name: "test2", age: 50 },
            { name: "test3", age: 100 }
        ];

        assert.deepEqual(await entity2.toJSON("name,customModels[name,age]"), {
            id: null,
            name: "entity2",
            customModels: [
                {
                    name: "test",
                    age: 30
                },
                {
                    name: "test2",
                    age: 50
                },
                {
                    name: "test3",
                    age: 100
                }
            ]
        });

        entity2.getModel().clean();

        entity1.customModels = entity2.customModels;

        const data = await entity1.toStorage();
        assert.deepEqual(data, {
            customModels:
                '[{"name":"test","age":30},{"name":"test2","age":50},{"name":"test3","age":100}]'
        });
    });

    it("should be able to assign value from one entity's models attribute to other entity (from storage test)", async () => {
        const entity1 = new ModelEntity();
        entity1.populateFromStorage({ name: "entity1", customModels: "[]" });

        const entity2 = new ModelEntity();
        entity2.populateFromStorage({
            name: "entity1",
            customModels:
                '[{"name":"test","age":30},{"name":"test2","age":50},{"name":"test3","age":100}]'
        });

        entity1.customModels = entity2.customModels;

        const data = await entity1.toStorage();
        assert.deepEqual(data, {
            customModels:
                '[{"name":"test","age":30},{"name":"test2","age":50},{"name":"test3","age":100}]'
        });
    });
});
