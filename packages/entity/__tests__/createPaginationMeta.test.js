import { createPaginationMeta } from "@webiny/entity";

describe("createPaginationMeta test", () => {
    test("should return correct pagination meta data", async () => {
        let meta = createPaginationMeta({
            page: 1,
            perPage: 10,
            totalCount: 100
        });

        expect(meta).toEqual({
            from: 1,
            nextPage: 2,
            page: 1,
            perPage: 10,
            previousPage: null,
            to: 10,
            totalCount: 100,
            totalPages: 10
        });

        meta = createPaginationMeta({
            totalCount: 100,
            page: 3,
            perPage: 7
        });

        expect(meta).toEqual({
            page: 3,
            perPage: 7,
            totalCount: 100,
            from: 15,
            nextPage: 4,
            previousPage: 2,
            to: 21,
            totalPages: 15
        });

        meta = createPaginationMeta({
            totalCount: 100,
            page: 3,
            perPage: 10
        });

        expect(meta).toEqual({
            from: 21,
            nextPage: 4,
            page: 3,
            perPage: 10,
            previousPage: 2,
            to: 30,
            totalCount: 100,
            totalPages: 10
        });

        meta = createPaginationMeta({
            totalCount: 15,
            page: 3,
            perPage: 6
        });

        expect(meta).toEqual({
            from: 13,
            nextPage: null,
            page: 3,
            perPage: 6,
            previousPage: 2,
            to: 15,
            totalCount: 15,
            totalPages: 3
        });

        meta = createPaginationMeta({
            totalCount: 0,
            page: 1,
            perPage: 10
        });

        expect(meta).toEqual({
            page: 1,
            perPage: 10,
            nextPage: null,
            previousPage: null,
            to: 0,
            from: 0,
            totalCount: 0,
            totalPages: 0
        });
    });
});
