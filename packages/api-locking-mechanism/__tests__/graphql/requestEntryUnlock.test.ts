import { ILockingMechanismLockRecordActionType } from "~/types";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { createIdentity } from "~tests/helpers/identity";

const secondIdentity = createIdentity({
    displayName: "Jane Doe",
    id: "id-87654321",
    type: "admin"
});

describe("request entry unlock", () => {
    const { lockEntryMutation } = useGraphQLHandler();

    const { unlockEntryRequestMutation } = useGraphQLHandler({
        identity: secondIdentity
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
                            updatedOn: expect.toBeDateString(),
                            expiresOn: expect.toBeDateString(),
                            targetId: "someId#0001",
                            type: "cms#author",
                            actions: [
                                {
                                    type: ILockingMechanismLockRecordActionType.requested,
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
