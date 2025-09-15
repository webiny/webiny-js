import { createDeploymentsFetcher } from "~/resolver/deployment/DeploymentsFetcher.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createMockDeploymentData, storeDeployment } from "~tests/mocks/deployments.js";
import { describe, expect, it, vi } from "vitest";

describe("DeploymentsFetcher", () => {
    const table = process.env.DB_TABLE as string;
    const client = getDocumentClient();

    it("should throw error on no deployments", async () => {
        const fetcher = createDeploymentsFetcher({
            client,
            table
        });

        try {
            const result = await fetcher.fetch();
            expect(result).toEqual("SHOULD NOT REACH!");
        } catch (ex) {
            expect(ex.message).toEqual("No deployments found which need to be synced.");
        }
    });

    it("should fetch deployments", async () => {
        await storeDeployment({
            client,
            tableName: table,
            item: createMockDeploymentData({
                env: "test",
                variant: "green"
            })
        });
        await storeDeployment({
            client,
            tableName: table,
            item: createMockDeploymentData({
                env: "test",
                variant: "blue"
            })
        });

        const fetcher = createDeploymentsFetcher({
            client,
            table
        });

        try {
            const result = await fetcher.fetch();

            expect(result.all()).toHaveLength(2);
        } catch (ex) {
            expect(ex.message).toEqual("SHOULD NOT REACH!");
        }
    });

    it("should fail to validate on invalid deployment information", async () => {
        await storeDeployment({
            client,
            tableName: table,
            item: createMockDeploymentData({
                env: undefined,
                variant: undefined,
                region: undefined,
                version: undefined
            })
        });
        await storeDeployment({
            client,
            tableName: table,
            item: createMockDeploymentData({
                env: "test",
                variant: "blue"
            })
        });

        const fetcher = createDeploymentsFetcher({
            client,
            table
        });

        try {
            const result = await fetcher.fetch();

            expect(result).toEqual("SHOULD NOT REACH!");
        } catch (ex) {
            expect(ex.message).toEqual("Validation failed.");
            expect(ex.data.invalidFields).toEqual({
                "1.env": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: [1, "env"]
                    },
                    message: "Required"
                },
                "1.region": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: [1, "region"]
                    },
                    message: "Required"
                },
                "1.version": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: [1, "version"]
                    },
                    message: "Required"
                }
            });
        }
    });

    it("should throw an error on client.send", async () => {
        const client = {
            send: vi.fn(() => {
                throw new Error("Unspecified error.");
            })
        };

        const fetcher = createDeploymentsFetcher({
            client,
            table
        });

        try {
            const result = await fetcher.fetch();
            expect(result).toEqual("SHOULD NOT REACH!");
        } catch (ex) {
            expect(ex.message).toEqual("Unspecified error.");
        }
    });
});
