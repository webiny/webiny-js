import { MainEntity, Entity1 } from "../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import sinon from "sinon";
import { QueryResult } from "../../../src";
const sandbox = sinon.sandbox.create();

describe("onSet test", function() {
    beforeEach(() => MainEntity.getEntityPool().flush());
    afterEach(() => sandbox.restore());

    it("should accept IDs directly and load them on entity save to process validation", async () => {
        /*        const entity = new MainEntity();
        entity.attribute1 = ['a', 'b', 'c'];
        assert.deepEqual(entity.getAttribute('attribute1').value.current, ['a', 'b', 'c']);
        assert.deepEqual(entity.getAttribute('attribute1').value.initial, []);

        let entityFind = sandbox.stub(Entity1.getDriver(), "find").callsFake(() => {
            return new QueryResult([
                { id: "a", name: "A", type: "dog", markedAsCannotDelete: false },
                { id: "b", name: "B", type: "dog", markedAsCannotDelete: false },
                { id: "c", name: "C", type: "dog", markedAsCannotDelete: false }
            ]);
        });

        await entity.save();*/
    });
});
