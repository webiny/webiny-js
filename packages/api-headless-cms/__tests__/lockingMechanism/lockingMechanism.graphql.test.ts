import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";

describe("locking mechanism graphql", () => {
    const {
        getLockRecordQuery,
        unlockEntryMutation,
        isEntryLockedQuery,
        lockEntryMutation,
        unlockEntryRequestMutation
    } = useGraphQLHandler();

    it("should throw an error on non-existing lock - getLockRecord", async () => {
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

    it("should return false on checking if entry is locked", async () => {
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
                            type: "cms#author"
                        },
                        error: null
                    }
                }
            }
        });
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
                            type: "cms#author"
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
                            type: "cms#author"
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
                        data: {},
                        error: null
                    }
                }
            }
        });
    });
});
