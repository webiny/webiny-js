import { describe, it, expect, vi, beforeEach } from "vitest";
import { Sdk } from "~/Sdk.js";

describe("Sdk", () => {
    let sdk: Sdk;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFetch = vi.fn();
        sdk = new Sdk({
            cms: {
                apiToken: "test-token",
                apiHost: "https://api.test.com",
                apiTenant: "test-tenant",
                fetch: mockFetch as any
            }
        });
    });

    describe("cms namespace", () => {
        it("should have cms property", () => {
            expect(sdk.cms).toBeDefined();
        });

        it("should execute CMS operations through cms namespace", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        getEntry: {
                            data: {
                                id: "123",
                                entryId: "entry-123"
                            },
                            error: null
                        }
                    }
                }
            };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            const result = await sdk.cms.getEntry({
                modelId: "article",
                where: { id: "123" },
                fields: ["values.title", "values.author.name"]
            });

            expect(mockFetch).toHaveBeenCalledWith(
                "https://api.test.com/graphql",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        Authorization: "Bearer test-token",
                        "x-tenant": "test-tenant"
                    })
                })
            );

            expect(result).toEqual({
                id: "123",
                entryId: "entry-123"
            });
        });

        it("should support all CMS methods", () => {
            expect(typeof sdk.cms.getEntry).toBe("function");
            expect(typeof sdk.cms.listEntries).toBe("function");
            expect(typeof sdk.cms.createEntry).toBe("function");
            expect(typeof sdk.cms.updateEntry).toBe("function");
            expect(typeof sdk.cms.deleteEntry).toBe("function");
            expect(typeof sdk.cms.publishEntry).toBe("function");
            expect(typeof sdk.cms.unpublishEntry).toBe("function");
        });
    });
});
