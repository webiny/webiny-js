import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("get lock record", () => {
    const { getLockRecordQuery } = useGraphQLHandler();

    it("should throw an error on non-existing lock - getLockRecord", async () => {
        const [response] = await getLockRecordQuery({
            id: "nonExistingId",
            type: "author"
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
});
