import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";

describe("is entry locked", () => {
    const { isEntryLockedQuery } = useGraphQLHandler();

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
});
