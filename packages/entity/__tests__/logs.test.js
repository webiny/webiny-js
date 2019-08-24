import { EntityWithLogs, EntityWithoutLogs } from "./entities/entityWithLogs";
import { DateAttribute } from "@webiny/model";

describe("entity with logs enabled test", () => {
    beforeEach(() => EntityWithLogs.getEntityPool().flush());

    test("should not have createdOn, savedOn and updatedOn if logging is not enabled", async () => {
        const entity = new EntityWithoutLogs();

        expect(entity.getAttribute("createdOn")).toEqual(undefined);
        expect(entity.getAttribute("updatedOn")).toEqual(undefined);
        expect(entity.getAttribute("savedOn")).toEqual(undefined);
    });

    test("it must have createdOn, savedOn and updatedOn attributes defined", async () => {
        const entity = new EntityWithLogs();

        expect(entity.getAttribute("createdOn")).toBeInstanceOf(DateAttribute);
        expect(entity.getAttribute("updatedOn")).toBeInstanceOf(DateAttribute);
        expect(entity.getAttribute("savedOn")).toBeInstanceOf(DateAttribute);

        expect(entity.createdOn).toEqual(null);
        expect(entity.updatedOn).toEqual(null);
        expect(entity.savedOn).toEqual(null);
    });

    test("it must update createdOn, updatedOn and savedOn correctly when saving entity", async () => {
        const entity = new EntityWithLogs();
        entity.name = "newOne";
        await entity.save();

        const savedOn = entity.savedOn;
        const createdOn = entity.createdOn;
        const updatedOn = entity.updatedOn;

        expect(savedOn).toBeInstanceOf(Date);
        expect(createdOn).toBeInstanceOf(Date);
        expect(updatedOn).toEqual(null);

        entity.name = "newOneUpdated";
        await entity.save();

        expect(entity.savedOn).toBeInstanceOf(Date);
        expect(entity.createdOn).toBeInstanceOf(Date);
        expect(entity.updatedOn).toBeInstanceOf(Date);

        // Check that values were updated.

        expect(entity.savedOn).not.toBe(savedOn);
        expect(entity.updatedOn).not.toBe(updatedOn);
        expect(entity.createdOn).toBe(createdOn);
    });
});
