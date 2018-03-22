import { MainEntity } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("dirty flag test", function() {
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("when loading from storage, default value must be clean", async () => {
        const entityFind = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 10 });
        });

        const entity = await MainEntity.findById(123);
        const attr = entity.getAttribute("attribute1");
        assert.isFalse(attr.value.dirty);
        entityFind.restore();
    });

    it("when setting a value, dirty must be set as true", async () => {
        const entity = new MainEntity();
        const attr = entity.getAttribute("attribute1");
        assert.isFalse(attr.value.dirty);
        entity.attribute1 = null;
        assert.isTrue(attr.value.dirty);
    });
});
