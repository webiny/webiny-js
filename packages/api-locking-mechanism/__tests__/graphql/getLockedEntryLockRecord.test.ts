import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity } from "~tests/helpers/identity";

describe("get locked entry lock record", () => {
    const {
        lockEntryMutation,
        getLockedEntryLockRecordQuery: creatorGetLockedEntryLockRecordQuery
    } = useGraphQLHandler();

    const { getLockedEntryLockRecordQuery } = useGraphQLHandler({
        identity: createIdentity({
            id: "anotherIdentityId",
            displayName: "Another Identity",
            type: "admin"
        })
    });

    it("should return null for non existing lock record - getLockedEntryLockRecord", async () => {
        const [response] = await getLockedEntryLockRecordQuery({
            id: "nonExistingId",
            type: "author"
        });

        expect(response).toMatchObject({
            data: {
                lockingMechanism: {
                    getLockedEntryLockRecord: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });

    it("should return a record for a locked entry", async () => {
        const [lockResult] = await lockEntryMutation({
            id: "aTestId#0001",
            type: "aTestType"
        });

        expect(lockResult).toMatchObject({
            data: {
                lockingMechanism: {
                    lockEntry: {
                        data: {
                            id: "aTestId"
                        },
                        error: null
                    }
                }
            }
        });

        const [shouldNotBeLockedResponse] = await creatorGetLockedEntryLockRecordQuery({
            id: "aTestId#0001",
            type: "author"
        });
        expect(shouldNotBeLockedResponse).toMatchObject({
            data: {
                lockingMechanism: {
                    getLockedEntryLockRecord: {
                        data: null,
                        error: null
                    }
                }
            }
        });

        const [shouldBeLockedResponse] = await getLockedEntryLockRecordQuery({
            id: "aTestId#0001",
            type: "author"
        });

        expect(shouldBeLockedResponse).toMatchObject({
            data: {
                lockingMechanism: {
                    getLockedEntryLockRecord: {
                        data: {
                            id: "aTestId"
                        },
                        error: null
                    }
                }
            }
        });
    });
});
