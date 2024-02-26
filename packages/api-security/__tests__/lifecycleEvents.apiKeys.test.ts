import useGqlHandler from "./useGqlHandler";

import { assignApiKeyLifecycleEvents, tracker } from "./mocks/lifecycleEvents";

describe("API Key Lifecycle Events", () => {
    const { install, securityApiKeys } = useGqlHandler({
        plugins: [assignApiKeyLifecycleEvents()]
    });

    beforeEach(async () => {
        await install.install();
        tracker.reset();
    });

    it("should trigger create lifecycle events", async () => {
        const [createResponse] = await securityApiKeys.create({
            data: { name: "Github Actions", description: "Github Actions Token", permissions: [] }
        });
        expect(createResponse).toEqual({
            data: {
                security: {
                    createApiKey: {
                        data: {
                            id: expect.any(String),
                            name: "Github Actions",
                            description: "Github Actions Token",
                            token: expect.any(String),
                            permissions: [],
                            createdOn: expect.any(String)
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("apiKey:beforeCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("apiKey:afterCreate")).toEqual(true);
        expect(tracker.isExecutedOnce("apiKey:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterDelete")).toEqual(false);
    });

    it("should trigger update lifecycle events", async () => {
        const [createResponse] = await securityApiKeys.create({
            data: { name: "Github Actions", description: "Github Actions Token", permissions: [] }
        });
        tracker.reset();

        const { data: token } = createResponse.data.security.createApiKey;

        const [updateResponse] = await securityApiKeys.update({
            id: token.id,
            data: { name: "Renamed token", description: "Updated description", permissions: [] }
        });

        expect(updateResponse).toEqual({
            data: {
                security: {
                    updateApiKey: {
                        data: {
                            id: token.id,
                            name: "Renamed token",
                            description: "Updated description",
                            token: token.token,
                            permissions: []
                        },
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("apiKey:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:beforeUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("apiKey:afterUpdate")).toEqual(true);
        expect(tracker.isExecutedOnce("apiKey:beforeDelete")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterDelete")).toEqual(false);
    });

    it("should trigger delete lifecycle events", async () => {
        const [createResponse] = await securityApiKeys.create({
            data: { name: "Github Actions", description: "Github Actions Token", permissions: [] }
        });
        tracker.reset();

        const { data: token } = createResponse.data.security.createApiKey;

        const [deleteResponse] = await securityApiKeys.delete({
            id: token.id
        });

        expect(deleteResponse).toEqual({
            data: {
                security: {
                    deleteApiKey: {
                        data: true,
                        error: null
                    }
                }
            }
        });

        expect(tracker.isExecutedOnce("apiKey:beforeCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterCreate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:beforeUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:afterUpdate")).toEqual(false);
        expect(tracker.isExecutedOnce("apiKey:beforeDelete")).toEqual(true);
        expect(tracker.isExecutedOnce("apiKey:afterDelete")).toEqual(true);
    });
});
