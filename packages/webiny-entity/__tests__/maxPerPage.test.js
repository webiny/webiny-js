import {
    EntityWithoutMaxPerPage,
    EntityWithMaxPerPage,
    EntityWithMaxPerPageSetToNull
} from "./entities/entityWithMaxPerPage";

describe("maxPerPage test", () => {
    test("must throw errors if maxPerPage config parameter was exceeded", async () => {
        await EntityWithoutMaxPerPage.find({ perPage: 99 });
        await EntityWithoutMaxPerPage.find({ perPage: 100 });

        let error = null;
        try {
            await EntityWithoutMaxPerPage.find({ perPage: 101 });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe("Cannot query for more than 100 entities per page.");

        await EntityWithMaxPerPage.find({ perPage: 499 });
        await EntityWithMaxPerPage.find({ perPage: 500 });

        error = null;
        try {
            await EntityWithMaxPerPage.find({ perPage: 501 });
        } catch (e) {
            error = e;
        }

        expect(error.message).toBe("Cannot query for more than 500 entities per page.");

        await EntityWithMaxPerPageSetToNull.find({ perPage: 100 });
        await EntityWithMaxPerPageSetToNull.find({ perPage: 500 });
        await EntityWithMaxPerPageSetToNull.find({ perPage: 1000 });
        await EntityWithMaxPerPageSetToNull.find({ perPage: 9999999999999999 });
    });
});
