import { Entity1, MainEntity } from "../../../entities/entitiesAttributeEntities";
import { QueryResult } from "@webiny/entity";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("attribute entities test", () => {
    afterEach(() => sandbox.restore());
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should use correct storage query to fetch linked entities", async () => {
        let entityFindById = sandbox
            .stub(MainEntity.getDriver(), "findOne")
            .callsFake(() => new QueryResult({ id: "A" }));

        const mainEntity = await MainEntity.findById(123);
        entityFindById.restore();

        const findSpy = sandbox.spy(MainEntity.getDriver(), "find");
        await mainEntity.attribute1;

        expect(findSpy.getCall(0).args[0]).toEqual(Entity1);
        expect(findSpy.getCall(0).args[1]).toEqual({
            page: 1,
            perPage: 10,
            query: {
                mainEntity: "A"
            }
        });

        findSpy.restore();
    });
});
