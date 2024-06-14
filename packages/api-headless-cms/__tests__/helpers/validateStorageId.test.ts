import { validateStorageId } from "~/crud/contentModel/validateStorageId";

describe("validateStorageId", () => {
    it("should validate storage ids", async () => {
        // Valid storage IDs
        expect(() => validateStorageId("pageTeaserMedia")).not.toThrow();
        expect(() => validateStorageId("number@productPrice123")).not.toThrow();
        expect(() => validateStorageId("long-text@description")).not.toThrow();
        expect(() => validateStorageId("text@0b6vu1w0")).not.toThrow();
        expect(() => validateStorageId("0b6vu1w0")).not.toThrow();
        expect(() => validateStorageId("0b6vu1w0-abc")).not.toThrow();

        // Invalid storage IDs
        expect(() => validateStorageId("some_weird_$_id")).toThrow();
        expect(() => validateStorageId("my!R3ally$creWedI\\d^^")).toThrow();
    });
});
