import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("lock entry", () => {
    const { getLockRecordQuery, isEntryLockedQuery, lockEntryMutation } = useGraphQLHandler();

    it("should create a lock record", async () => {
        const [isEntryLockedResponse] = await isEntryLockedQuery({
            id: "someId",
            type: "cms#author"
        });

        expect(isEntryLockedResponse).toEqual({
            data: {
                lockingMechanism: {
                    isEntryLocked: {
                        data: false,
                        error: null
                    }
                }
            }
        });

        const [response] = await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });

        expect(response).toEqual({
            data: {
                lockingMechanism: {
                    lockEntry: {
                        data: {
                            id: "someId",
                            lockedBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });

        const [getResponse] = await getLockRecordQuery({
            id: "someId"
        });
        expect(getResponse).toEqual({
            data: {
                lockingMechanism: {
                    getLockRecord: {
                        data: {
                            id: "someId",
                            lockedBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });
    });

    it("should return error if entry is already locked", async () => {
        const [firstLockResponse] = await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });

        expect(firstLockResponse).toEqual({
            data: {
                lockingMechanism: {
                    lockEntry: {
                        data: {
                            id: "someId",
                            lockedBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });

        const [response] = await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });
        expect(response).toEqual({
            data: {
                lockingMechanism: {
                    lockEntry: {
                        data: null,
                        error: {
                            code: "ENTRY_ALREADY_LOCKED",
                            message: "Entry is already locked for editing.",
                            data: {
                                id: "someId#0001",
                                type: "cms#author"
                            }
                        }
                    }
                }
            }
        });
    });
});
