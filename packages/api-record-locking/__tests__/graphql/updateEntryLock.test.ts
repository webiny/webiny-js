import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity } from "~tests/helpers/identity";

describe("update entry lock", () => {
    const { updateEntryLockMutation, lockEntryMutation } = useGraphQLHandler();

    it("should update the lock record", async () => {
        const [lockResult] = await lockEntryMutation({
            id: "aTestId#0001",
            type: "aTestType"
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
            type: "aTestType"
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
            type: "aTestType"
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
            type: "aTestType"
        });
        expect(result).toEqual({
            data: {
                recordLocking: {
                    updateEntryLock: {
                        data: null,
                        error: {
                            code: "LOCK_UPDATE_ERROR",
                            data: null,
                            message: "Cannot update lock record. Record is locked by another user."
                        }
                    }
                }
            }
        });
    });

    it("should return a new lock if no existing lock record", async () => {
        const [result] = await updateEntryLockMutation({
            id: "aTestId#0001",
            type: "aTestType"
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
