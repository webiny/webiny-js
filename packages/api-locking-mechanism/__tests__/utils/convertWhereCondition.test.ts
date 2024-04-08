import { convertWhereCondition } from "~/utils/convertWhereCondition";

describe("it should properly convert where condition from locking mechanism to standard cms where condition", () => {
    it("should return undefined if no where condition is provided", () => {
        const result = convertWhereCondition(undefined);

        expect(result).toBeUndefined();
    });

    it("should not change where condition", async () => {
        const where = {
            entryId: "123",
            somethingElse_gt: 123,
            somethingElse_lt: 1000,
            aText_contains: "webiny"
        };
        const result = convertWhereCondition(where);

        expect(result).toEqual(where);
    });

    it("should convert where condition", async () => {
        const constantWhere = {
            somethingElse_gt: 123,
            somethingElse_lt: 1000,
            aText_contains: "webiny"
        };
        const where = {
            ...constantWhere,
            id: "123",
            id_in: ["123", "456"],
            id_not: "123",
            id_not_in: ["123", "456"]
        };
        const result = convertWhereCondition(where);

        expect(result).toEqual({
            ...constantWhere,
            entryId: "123",
            entryId_in: ["123", "456"],
            entryId_not: "123",
            entryId_not_in: ["123", "456"]
        });
    });

    it("should convert nested where condition", async () => {
        const where = {
            id_in: ["123", "456"],
            AND: [
                {
                    id: "123",
                    id_not: "456",
                    somethingElse_gt: 123
                },
                {
                    id_in: ["789", "101112"],
                    OR: [
                        {
                            id: "123"
                        },
                        {
                            id: "456"
                        }
                    ]
                },
                {
                    OR: [
                        {
                            id: "123"
                        },
                        {
                            id: "456"
                        },
                        {
                            AND: [
                                {
                                    id: "789"
                                },
                                {
                                    id: "101112"
                                }
                            ]
                        }
                    ]
                }
            ],
            OR: [
                {
                    id: "123"
                },
                {
                    id: "456"
                },
                {
                    AND: [
                        {
                            id: "789"
                        },
                        {
                            id: "101112"
                        }
                    ]
                }
            ]
        };

        const result = convertWhereCondition(where);

        const converted = JSON.parse(JSON.stringify(where).replaceAll("id", "entryId"));
        /**
         * Make sure that the root id is converted.
         */
        expect(converted.entryId_in).toEqual(["123", "456"]);
        /**
         * We can now test the rest of the object.
         */
        expect(result).toEqual(converted);
    });
});
