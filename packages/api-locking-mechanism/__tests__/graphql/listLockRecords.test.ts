import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("list lock records", () => {
    const { listLockRecordsQuery } = useGraphQLHandler();

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
});
