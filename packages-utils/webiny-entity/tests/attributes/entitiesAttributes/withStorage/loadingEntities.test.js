import { Entity1, MainEntityWithStorage } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", function() {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntityWithStorage.getEntityPool().flush());

    it("should use correct storage query to fetch linked entities", async () => {
        let entityFindById = sandbox
            .stub(MainEntityWithStorage.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A", attribute1: ["X", "Y", "Z"] }));

        const mainEntityWithStorage = await MainEntityWithStorage.findById(123);
        entityFindById.restore();

        const findSpy = sandbox.spy(MainEntityWithStorage.getDriver(), "find");
        await mainEntityWithStorage.attribute1;

        assert.equal(findSpy.getCall(0).args[0], Entity1);
        assert.deepEqual(findSpy.getCall(0).args[1], {
            query: {
                id: ["X", "Y", "Z"]
            }
        });

        findSpy.restore();
    });
});
