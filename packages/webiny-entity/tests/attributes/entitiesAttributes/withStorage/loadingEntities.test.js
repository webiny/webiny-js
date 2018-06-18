import { Entity1, MainEntityWithStorage } from "../../../entities/entitiesAttributeEntities";
import { QueryResult } from "../../../../src";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntityWithStorage.getEntityPool().flush());

    test("should use correct storage query to fetch linked entities", async () => {
        let entityFindById = sandbox
            .stub(MainEntityWithStorage.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A", attribute1: ["X", "Y", "Z"] }));

        const mainEntityWithStorage = await MainEntityWithStorage.findById(123);
        entityFindById.restore();

        const findSpy = sandbox.spy(MainEntityWithStorage.getDriver(), "findOne");
        await mainEntityWithStorage.attribute1;

        expect(findSpy.getCall(0).args[0]).toEqual(Entity1);
        expect(findSpy.getCall(1).args[0]).toEqual(Entity1);
        expect(findSpy.getCall(2).args[0]).toEqual(Entity1);
        expect(findSpy.getCall(0).args[1]).toEqual({
            query: {
                id: "X"
            }
        });

        expect(findSpy.getCall(1).args[1]).toEqual({
            query: {
                id: "Y"
            }
        });

        expect(findSpy.getCall(2).args[1]).toEqual({
            query: {
                id: "Z"
            }
        });

        findSpy.restore();
    });
});
