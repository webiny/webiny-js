import { validateStorageId } from "~/crud/contentModel/validateStorageId";

describe("validateStorageId", () => {
    it.each([
        ["pageTeaserMedia"],
        ["number@productPrice123"],
        ["long-text@description"],
        ["text@0b6vu1w0"],
        ["0b6vu1w0"],
        ["0b6vu1w0-abc"]
    ])(`should pass storage id validation - "%s"`, async storageId => {
        expect(() => validateStorageId(storageId)).not.toThrow();
    });

    it.each([["some_weird_$_id"], ["my!/[R]{3}ally$creWedI:_+\\d^^"], ["读写汉字 - 学中文"]])(
        `should fail storage id validation - "%s"`,
        async storageId => {
            expect(() => validateStorageId(storageId)).toThrow();
        }
    );
});
