import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("list lock records", () => {
    const { listLockRecordsQuery, lockEntryMutation } = useGraphQLHandler();

    it("should list lock records - none found", async () => {
        const [result] = await listLockRecordsQuery();

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

        const [result] = await listLockRecordsQuery();

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

        const [resultIdIn] = await listLockRecordsQuery({
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
