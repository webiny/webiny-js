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
});
