import { describe, it, expect } from "vitest";
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
                recordLocking: {
                    getLockRecord: {
                        data: null,
                        error: {
                            code: "RecordLocking/LockRecord/NotFoundError",
                            message: "Lock record not found.",
                            data: null
                        }
                    }
                }
            }
        });
    });
});
