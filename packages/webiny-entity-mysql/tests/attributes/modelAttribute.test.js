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
        this.attr("customModel").model(CustomModel);
    }
}

ModelEntity.classId = "BooleanEntity";

describe("model attribute test", function() {
    it("it must return JSON string as storage value", async () => {
        const entity = new ModelEntity();
        entity.populate({ name: "Test-1", customModel: { name: "test", age: 33 } });

        assert.instanceOf(await entity.customModel, CustomModel);

        const data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test-1",
            customModel: '{"name":"test","age":33}'
        });
    });

    it("it must return value itself if it's missing (eg. null)", async () => {
        const entity = new ModelEntity();
        entity.populate({ name: "Test-1" });
        entity.getAttribute("customModel").value.dirty = true;

        const data = await entity.toStorage();
        assert.deepEqual(data, {
            name: "Test-1",
            customModel: null
        });
    });

    it("once received from storage, value should be converted to a plain object, otherwise nothing should be set", async () => {
        const entity = new ModelEntity();
        entity.populateFromStorage({
            name: "Test-1",
            customModel: '{"name":"test","age":33}'
        });

        assert.deepEqual(await entity.toJSON("name,customModel[name,age]"), {
            id: null,
            name: "Test-1",
            customModel: {
                name: "test",
                age: 33
            }
        });
        assert.isTrue(entity.isClean());

        entity.populateFromStorage({
            name: "Test-1",
            customModel: null
        });

        assert.isTrue(entity.isClean());
    });

    it("should be able to assign value from one another entity's model attribute to other entity", async () => {
        const entity1 = new ModelEntity();

        const entity2 = new ModelEntity();
        entity2.name = "entity2";
        entity2.customModel = { name: "test", age: 30 };

        assert.deepEqual(await entity2.toJSON("name,customModel[name,age]"), {
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
        assert.deepEqual(data, {
            customModel: '{"name":"test","age":30}'
        });
    });

    it("should be able to assign value from one entity's models attribute to other entity (from storage test)", async () => {
        const entity1 = new ModelEntity();
        entity1.populateFromStorage({ name: "entity1" });

        const entity2 = new ModelEntity();
        entity2.populateFromStorage({ name: "entity1", customModel: '{"name":"test","age":30}' });

        entity1.customModel = entity2.customModel;

        const data = await entity1.toStorage();
        assert.deepEqual(data, {
            customModel: '{"name":"test","age":30}'
        });
    });
});
