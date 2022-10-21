import { createGraphQLHandler } from "./createGraphQLHandler";

jest.mock("nodemailer", () => {
    return {
        createTransport: () => {
            const message = "Transport should not be created at this point.";
            console.log("Transport should not be created at this point.");
            throw new Error(message);
        }
    };
});

describe("Mailer Settings GraphQL", () => {
    const handler = createGraphQLHandler();

    it("should fetch settings via graphql", async () => {
        const [response] = await handler.getSettings();

        expect(response).toEqual({
            data: {
                mailer: {
                    getSettings: {
                        data: null,
                        error: null
                    }
                }
            }
        });
    });
});
