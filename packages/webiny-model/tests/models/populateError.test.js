import { ModelError, Model } from "../..";

describe("populate error test", async () => {
    test("should throw error - populate can only receive objects", async () => {
        const user = new Model();

        let error = null;
        try {
            user.populate(123);
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.POPULATE_FAILED_NOT_OBJECT);

        error = null;
        try {
            user.populateFromStorage(123);
        } catch (e) {
            error = e;
        }

        expect(error).toBeInstanceOf(ModelError);
        expect(error.code).toEqual(ModelError.POPULATE_FAILED_NOT_OBJECT);
    });
});
