import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { IHeadlessCmsLockRecordActionType } from "~/lockingMechanism/types";
import { createIdentity } from "~tests/testHelpers/helpers";

const secondIdentity = createIdentity({
    displayName: "Jane Doe",
    id: "id-87654321",
    type: "admin"
});

describe("locking mechanism graphql", () => {
    const { getLockRecordQuery, unlockEntryMutation, isEntryLockedQuery, lockEntryMutation } =
        useGraphQLHandler();

    const { unlockEntryRequestMutation } = useGraphQLHandler({
        identity: secondIdentity
    });

    it.skip("should throw an error on non-existing lock - getLockRecord", async () => {
        const [response] = await getLockRecordQuery({
            id: "nonExistingId"
        });

        expect(response).toMatchObject({
            data: {
                lockingMechanism: {
                    getLockRecord: {
                        data: null,
                        error: {
                            code: "NOT_FOUND",
                            message: "Lock record not found.",
                            data: null
                        }
                    }
                }
            }
        });
    });

    it.skip("should return false on checking if entry is locked", async () => {
        const [response] = await isEntryLockedQuery({
            id: "someId",
            type: "cms#author"
        });

        expect(response).toEqual({
            data: {
                lockingMechanism: {
                    isEntryLocked: {
                        data: false,
                        error: null
                    }
                }
            }
        });
    });

    it.skip("should create a lock record", async () => {
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

    it.skip("should unlock a locked entry", async () => {
        /**
         * Even if there is no lock record, we should act as the entry was unlocked.
         */
        const [unlockResponseNoEntry] = await unlockEntryMutation({
            type: "cms#author",
            id: "someId#0001"
        });
        expect(unlockResponseNoEntry).toEqual({
            data: {
                lockingMechanism: {
                    unlockEntry: {
                        data: true,
                        error: null
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
                            targetId: "someId#0001",
                            type: "cms#author"
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
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });

        const [isEntryLockedResponse] = await isEntryLockedQuery({
            id: "someId#0001",
            type: "cms#author"
        });
        expect(isEntryLockedResponse).toEqual({
            data: {
                lockingMechanism: {
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
                lockingMechanism: {
                    unlockEntry: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        const [getResponseAfterUnlock] = await getLockRecordQuery({
            id: "someId"
        });
        expect(getResponseAfterUnlock).toMatchObject({
            data: {
                lockingMechanism: {
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

    it("should request unlocking of a locked entry", async () => {
        const [lockEntryResponse] = await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });
        expect(lockEntryResponse).toMatchObject({
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
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: []
                        },
                        error: null
                    }
                }
            }
        });

        const [unlockEntryRequestResponse] = await unlockEntryRequestMutation({
            type: "cms#author",
            id: "someId#0001"
        });

        expect(unlockEntryRequestResponse).toEqual({
            data: {
                lockingMechanism: {
                    unlockEntryRequest: {
                        data: {
                            id: "someId",
                            lockedBy: {
                                displayName: "John Doe",
                                id: "id-12345678",
                                type: "admin"
                            },
                            lockedOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: [
                                {
                                    type: IHeadlessCmsLockRecordActionType.requested,
                                    message: null,
                                    createdBy: secondIdentity,
                                    createdOn: expect.toBeDateString()
                                }
                            ]
                        },
                        error: null
                    }
                }
            }
        });

        const [unlockEntryRequestErrorResponse] = await unlockEntryRequestMutation({
            type: "cms#author",
            id: "someId#0001"
        });

        expect(unlockEntryRequestErrorResponse).toMatchObject({
            data: {
                lockingMechanism: {
                    unlockEntryRequest: {
                        data: null,
                        error: {
                            code: "UNLOCK_REQUEST_ALREADY_SENT",
                            data: {
                                id: "someId#0001",
                                type: "cms#author"
                            },
                            message: "Unlock request already sent."
                        }
                    }
                }
            }
        });
    });
});
