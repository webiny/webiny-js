import { createMailerHandler } from "./createGraphQLHandler";

describe("Mailer Settings GraphQL", () => {
    const handler = createMailerHandler();

    it("should fetch settings via graphql", async () => {
        const [response] = await handler.getSettings();

        expect(response).toEqual({
            data: {
                mailer: {
                    data: null,
                    error: null
                }
            }
        });
    });
});
