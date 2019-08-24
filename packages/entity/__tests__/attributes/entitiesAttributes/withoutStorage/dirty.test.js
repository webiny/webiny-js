import { MainEntity } from "../../../entities/entitiesAttributeEntities";
import { QueryResult } from "@webiny/entity";
import sinon from "sinon";
const sandbox = sinon.sandbox.create();

describe("dirty flag test", () => {
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("when loading from storage, default value must be clean", async () => {
        const entityFind = sandbox.stub(MainEntity.getDriver(), "findOne").callsFake(() => {
            return new QueryResult({ id: 10 });
        });

        const entity = await MainEntity.findById(123);
        const attr = entity.getAttribute("attribute1");
        expect(attr.value.dirty).toBe(false);
        entityFind.restore();
    });

    test("when setting a value, dirty must be set as true", async () => {
        const entity = new MainEntity();
        const attr = entity.getAttribute("attribute1");
        expect(attr.value.dirty).toBe(false);
        entity.attribute1 = null;
        expect(attr.value.dirty).toBe(true);
    });
});
