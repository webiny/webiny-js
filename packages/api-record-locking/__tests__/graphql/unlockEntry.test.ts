import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity, getSecurityIdentity } from "~tests/helpers/identity";

describe("unlock entry", () => {
    const { getLockRecordQuery, unlockEntryMutation, lockEntryMutation } = useGraphQLHandler();

    const anotherUserGraphQL = useGraphQLHandler({
        identity: createIdentity({
            displayName: "Jane Doe",
            id: "id-87654321",
            type: "admin"
        })
    });

    it("should unlock a locked entry", async () => {
        /**
         * Even if there is no lock record, we should act as the entry was unlocked.
         */
        const [unlockResponseNoEntry] = await unlockEntryMutation({
            type: "cms#author",
            id: "someId#0001"
        });
        expect(unlockResponseNoEntry).toEqual({
            data: {
                recordLocking: {
                    unlockEntry: {
                        data: null,
                        error: {
                            code: "LOCK_RECORD_NOT_FOUND",
                            data: {
                                id: "someId#0001",
                                type: "cms#author"
                            },
                            message: "Lock Record not found."
                        }
                    }
                }
            }
        });

        const [lockEntryResponse] = await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });
        expect(lockEntryResponse).toMatchObject({
            data: {
                recordLocking: {
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
                            expiresOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author"
                        },
                        error: null
                    }
                }
            }
        });

        const [getResponse] = await getLockRecordQuery({
            id: "someId",
            type: "cms#author"
        });
        expect(getResponse).toEqual({
            data: {
                recordLocking: {
                    getLockRecord: {
                        data: {
                            id: "someId",
                            lockedBy: getSecurityIdentity(),
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString(),
                            expiresOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });

        const [isEntryLockedResponse] = await anotherUserGraphQL.isEntryLockedQuery({
            id: "someId#0001",
            type: "cms#author"
        });
        expect(isEntryLockedResponse).toEqual({
            data: {
                recordLocking: {
                    isEntryLocked: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [unlockResponse] = await unlockEntryMutation({
            type: "cms#author",
            id: "someId#0001"
        });
        expect(unlockResponse).toEqual({
            data: {
                recordLocking: {
                    unlockEntry: {
                        data: {
                            actions: [],
                            id: "someId",
                            lockedBy: getSecurityIdentity(),
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString(),
                            expiresOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author"
                        },
                        error: null
                    }
                }
            }
        });

        const [getResponseAfterUnlock] = await getLockRecordQuery({
            id: "someId",
            type: "cms#author"
        });
        expect(getResponseAfterUnlock).toMatchObject({
            data: {
                recordLocking: {
                    getLockRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            data: null,
                            message: "Lock record not found."
                        }
                    }
                }
            }
        });
    });
});
