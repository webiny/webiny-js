import { createIdentity } from "~tests/helpers/identity";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("list lock records", () => {
    const { lockEntryMutation } = useGraphQLHandler();

    const anotherUserGraphQL = useGraphQLHandler({
        identity: createIdentity({
            displayName: "Jane Doe",
            id: "id-87654321",
            type: "admin"
        })
    });

    it("should list lock records - none found", async () => {
        const [result] = await anotherUserGraphQL.listLockRecordsQuery();

        expect(result).toEqual({
            data: {
                lockingMechanism: {
                    listLockRecords: {
                        data: [],
                        error: null
                    }
                }
            }
        });
    });

    it("should list all locked records", async () => {
        await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });

        await lockEntryMutation({
            id: "someOtherId#0001",
            type: "cms#author"
        });

        const [result] = await anotherUserGraphQL.listLockRecordsQuery();

        expect(result.data.lockingMechanism.listLockRecords.data).toHaveLength(2);
        expect(result).toMatchObject({
            data: {
                lockingMechanism: {
                    listLockRecords: {
                        data: [
                            {
                                id: "someOtherId"
                            },
                            {
                                id: "someId"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });

    it("should list filtered locked records", async () => {
        await lockEntryMutation({
            id: "someId#0001",
            type: "cms#author"
        });

        await lockEntryMutation({
            id: "someOtherId#0001",
            type: "cms#author"
        });

        const [resultIdIn] = await anotherUserGraphQL.listLockRecordsQuery({
            where: {
                id_in: ["someId"],
                type: "cms#author"
            }
        });

        expect(resultIdIn.data.lockingMechanism.listLockRecords.data).toHaveLength(2);
        expect(resultIdIn).toMatchObject({
            data: {
                lockingMechanism: {
                    listLockRecords: {
                        data: [
                            {
                                id: "someOtherId"
                            },
                            {
                                id: "someId"
                            }
                        ],
                        error: null
                    }
                }
            }
        });
    });
});
