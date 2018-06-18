import { MainEntityWithStorage } from "../../../entities/entitiesAttributeEntities";
import { QueryResult } from "../../../../src";
import sinon from "sinon";

const sandbox = sinon.sandbox.create();

describe("dirty flag test", () => {
    beforeEach(() => MainEntityWithStorage.getEntityPool().flush());

    test("when loading from storage, default value must be clean", async () => {
        const entityFind = sandbox
            .stub(MainEntityWithStorage.getDriver(), "findOne")
            .callsFake(() => {
                return new QueryResult({ id: 10, attribute1: ["a", "b", "c"] });
            });

        const entity = await MainEntityWithStorage.findById(123);
        const attr = entity.getAttribute("attribute1");
        expect(attr.value.current).toEqual(["a", "b", "c"]);
        expect(attr.value.set).toBe(true);
        expect(attr.value.dirty).toBe(false);
        entityFind.restore();
    });

    test("when setting a value, dirty must be set as true", async () => {
        const entity = new MainEntityWithStorage();
        const attr = entity.getAttribute("attribute1");
        expect(attr.value.dirty).toBe(false);
        entity.attribute1 = null;
        expect(attr.value.dirty).toBe(true);
    });
});
