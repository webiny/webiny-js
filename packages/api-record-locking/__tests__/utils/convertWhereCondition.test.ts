import { convertWhereCondition } from "~/utils/convertWhereCondition";
import { createLockRecordDatabaseId } from "~/utils/lockRecordDatabaseId";

describe("it should properly convert where condition from record locking to standard cms where condition", () => {
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
            entryId: createLockRecordDatabaseId(`123`),
            entryId_in: [createLockRecordDatabaseId("123"), createLockRecordDatabaseId("456")],
            entryId_not: createLockRecordDatabaseId("123"),
            entryId_not_in: [createLockRecordDatabaseId("123"), createLockRecordDatabaseId("456")]
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

        expect(result).toEqual({
            entryId_in: [createLockRecordDatabaseId("123"), createLockRecordDatabaseId("456")],
            AND: [
                {
                    entryId: createLockRecordDatabaseId("123"),
                    entryId_not: createLockRecordDatabaseId("456"),
                    somethingElse_gt: 123
                },
                {
                    entryId_in: [
                        createLockRecordDatabaseId("789"),
                        createLockRecordDatabaseId("101112")
                    ],
                    OR: [
                        {
                            entryId: createLockRecordDatabaseId("123")
                        },
                        {
                            entryId: createLockRecordDatabaseId("456")
                        }
                    ]
                },
                {
                    OR: [
                        {
                            entryId: createLockRecordDatabaseId("123")
                        },
                        {
                            entryId: createLockRecordDatabaseId("456")
                        },
                        {
                            AND: [
                                {
                                    entryId: createLockRecordDatabaseId("789")
                                },
                                {
                                    entryId: createLockRecordDatabaseId("101112")
                                }
                            ]
                        }
                    ]
                }
            ],
            OR: [
                {
                    entryId: createLockRecordDatabaseId("123")
                },
                {
                    entryId: createLockRecordDatabaseId("456")
                },
                {
                    AND: [
                        {
                            entryId: createLockRecordDatabaseId("789")
                        },
                        {
                            entryId: createLockRecordDatabaseId("101112")
                        }
                    ]
                }
            ]
        });
    });
});
