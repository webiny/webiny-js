import { MainEntity } from "../../../entities/entitiesAttributeEntities";

describe("attribute entities test", () => {
    beforeEach(() => MainEntity.getEntityPool().flush());

    test("should not set anything as values since setToStorage is not enabled by default", async () => {
        const mainEntity = new MainEntity();

        mainEntity.populateFromStorage({
            attribute1: ["A", "B"],
            attribute2: ["C"]
        });

        expect(Array.isArray(mainEntity.getAttribute("attribute1").value.getCurrent())).toBe(true);
        expect(Array.isArray(mainEntity.getAttribute("attribute2").value.getCurrent())).toBe(true);
    });
});
