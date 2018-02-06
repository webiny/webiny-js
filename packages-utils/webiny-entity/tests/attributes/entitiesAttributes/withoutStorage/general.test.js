import { MainEntity } from "../../../entities/entitiesAttributeEntities";
import { assert } from "chai";

describe("attribute entities test", function() {
    it("should not set anything as values since setToStorage is not enabled by default", async () => {
        const mainEntity = new MainEntity();

        mainEntity.populateFromStorage({
            attribute1: ["A", "B"],
            attribute2: ["C"]
        });

        assert.isArray(mainEntity.getAttribute("attribute1").value.getCurrent());
        assert.isArray(mainEntity.getAttribute("attribute2").value.getCurrent());
    });
});
