import { useHandler } from "~tests/helpers/useHandler";

describe("import from url - graphql", () => {
    it("should fail to import from URL because of invalid ID", async () => {
        const { importFromUrl } = useHandler();

        const [result] = await importFromUrl({
            id: "unknownId"
        });
        expect(result).toEqual({
            data: {
                importFromUrl: {
                    data: null,
                    error: {
                        code: "NOT_FOUND",
                        data: null,
                        message: `Import from URL task with id "unknownId" not found.`
                    }
                }
            }
        });
    });
});
