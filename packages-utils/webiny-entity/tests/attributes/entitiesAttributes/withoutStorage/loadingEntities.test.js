import { Entity1, MainEntity } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    it("should use correct storage query to fetch linked entities", async () => {
        let entityFindById = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));

        const mainEntity = await MainEntity.findById(123);
        entityFindById.restore();

        const findSpy = sandbox.spy(MainEntity.getDriver(), "find");
        await mainEntity.attribute1;

        assert.equal(findSpy.getCall(0).args[0], Entity1);
        assert.deepEqual(findSpy.getCall(0).args[1], {
            query: {
                mainEntity: "A"
            }
        });

        findSpy.restore();
    });
});
