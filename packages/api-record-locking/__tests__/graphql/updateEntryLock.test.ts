import { describe, it, expect, vi, afterEach } from "vitest";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity } from "~tests/helpers/identity";

describe("update entry lock", () => {
    const { updateEntryLockMutation, lockEntryMutation } = useGraphQLHandler();

    it("should update the lock record", async () => {
        const [lockResult] = await lockEntryMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(lockResult).toMatchObject({
            data: {
                recordLocking: {
                    lockEntry: {
                        data: {
                            id: "aTestId",
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString()
                        },
                        error: null
                    }
                }
            }
        });

        const initialLockedOn = lockResult.data.recordLocking.lockEntry.data!.lockedOn;
        const initialUpdatedOn = lockResult.data.recordLocking.lockEntry.data!.updatedOn;

        expect(initialLockedOn).toEqual(initialUpdatedOn);

        const [result] = await updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(result).toMatchObject({
            data: {
                recordLocking: {
                    updateEntryLock: {
                        data: {
                            id: "aTestId",
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString()
                        },
                        error: null
                    }
                }
            }
        });
        const updatedOn = result.data.recordLocking.updateEntryLock.data!.updatedOn;
        expect(new Date(updatedOn).getTime()).toBeGreaterThan(new Date(initialUpdatedOn).getTime());
    });

    it("should return an error if lock record is not of the same user trying to update it", async () => {
        await lockEntryMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });

        const anotherUserMethods = useGraphQLHandler({
            identity: createIdentity({
                id: "anotherUserId",
                displayName: "Another User",
                type: "admin"
            })
        });

        const [result] = await anotherUserMethods.updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(result).toEqual({
            data: {
                recordLocking: {
                    updateEntryLock: {
                        data: null,
                        error: {
                            code: "RecordLocking/Identity/MismatchError",
                            data: {
                                currentId: "anotherUserId",
                                targetId: "id-12345678"
                            },
                            message: "Identity mismatch - cannot perform action."
                        }
                    }
                }
            }
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should hand over an expired lock record to the user updating it", async () => {
        await lockEntryMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });

        // Move past the default lock timeout (60 seconds).
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(Date.now() + 5 * 60 * 1000));

        const anotherUserMethods = useGraphQLHandler({
            identity: createIdentity({
                id: "anotherUserId",
                displayName: "Another User",
                type: "admin"
            })
        });

        const [result] = await anotherUserMethods.updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(result).toMatchObject({
            data: {
                recordLocking: {
                    updateEntryLock: {
                        data: {
                            id: "aTestId",
                            lockedBy: {
                                id: "anotherUserId"
                            }
                        },
                        error: null
                    }
                }
            }
        });

        // The new owner can keep the lock alive.
        const [renewed] = await anotherUserMethods.updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(renewed.data.recordLocking.updateEntryLock.error).toBeNull();
        expect(renewed.data.recordLocking.updateEntryLock.data.lockedBy.id).toEqual(
            "anotherUserId"
        );

        // The previous owner cannot.
        const [previousOwner] = await updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });
        expect(previousOwner.data.recordLocking.updateEntryLock.error).toMatchObject({
            code: "RecordLocking/Identity/MismatchError"
        });
    });

    it("should return a new lock if no existing lock record", async () => {
        const [result] = await updateEntryLockMutation({
            id: "aTestId#0001",
            type: "cms#author"
        });

        expect(result).toMatchObject({
            data: {
                recordLocking: {
                    updateEntryLock: {
                        data: {
                            id: "aTestId",
                            lockedOn: expect.toBeDateString(),
                            updatedOn: expect.toBeDateString()
                        },
                        error: null
                    }
                }
            }
        });
    });
});
