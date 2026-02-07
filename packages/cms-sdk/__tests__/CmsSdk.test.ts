import { describe, it, expect, vi, beforeEach } from "vitest";
import { CmsSdk } from "~/CmsSdk.js";

describe("CmsSdk", () => {
    let sdk: CmsSdk;
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockFetch = vi.fn();
        sdk = new CmsSdk({
            apiToken: "test-token",
            apiHost: "https://api.test.com",
            apiTenant: "test-tenant",
            fetch: mockFetch as any
        });
    });

    describe("getEntry", () => {
        it("should execute GraphQL query for getEntry", async () => {
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

            const result = await sdk.getEntry({
                modelId: "article",
                where: { id: "123" },
                fields: ["title", "author.name"]
            });

            expect(mockFetch).toHaveBeenCalledWith(
                "https://api.test.com/graphql",
                expect.objectContaining({
                    method: "POST",
                    headers: expect.objectContaining({
                        "Content-Type": "application/json",
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

        it("should throw error if GraphQL returns error", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        getEntry: {
                            data: null,
                            error: {
                                message: "Entry not found",
                                code: "NOT_FOUND"
                            }
                        }
                    }
                }
            };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            await expect(
                sdk.getEntry({
                    modelId: "article",
                    where: { id: "123" }
                })
            ).rejects.toThrow("Entry not found");
        });
    });

    describe("listEntries", () => {
        it("should execute GraphQL query for listEntries", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        listEntries: {
                            data: [
                                { id: "123", entryId: "entry-123" },
                                { id: "456", entryId: "entry-456" }
                            ],
                            meta: {
                                cursor: "next-cursor",
                                hasMoreItems: true,
                                totalCount: 10
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

            const result = await sdk.listEntries({
                modelId: "article",
                where: { category: "news" },
                sort: { savedOn: "asc" },
                limit: 10
            });

            expect(result.items).toHaveLength(2);
            expect(result.meta.totalCount).toBe(10);
            expect(result.meta.hasMoreItems).toBe(true);
        });
    });

    describe("createEntry", () => {
        it("should execute GraphQL mutation for createEntry", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        createEntry: {
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

            const result = await sdk.createEntry({
                modelId: "article",
                values: {
                    title: "My article"
                }
            });

            expect(result).toEqual({
                id: "123",
                entryId: "entry-123"
            });
        });
    });

    describe("updateEntry", () => {
        it("should execute GraphQL mutation for updateEntry", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        updateEntry: {
                            data: {
                                id: "123#0002",
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

            const result = await sdk.updateEntry({
                modelId: "article",
                id: "123#0002",
                values: {
                    title: "Updated article"
                }
            });

            expect(result.id).toBe("123#0002");
        });
    });

    describe("deleteEntry", () => {
        it("should execute GraphQL mutation for deleteEntry", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        deleteEntry: {
                            data: true,
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

            const result = await sdk.deleteEntry({
                modelId: "article",
                id: "123#0002",
                permanent: true
            });

            expect(result).toBe(true);
        });
    });

    describe("publishEntry", () => {
        it("should execute GraphQL mutation for publishEntry", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        publishEntry: {
                            data: {
                                id: "123#0002",
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

            const result = await sdk.publishEntry({
                modelId: "article",
                id: "123#0002"
            });

            expect(result.id).toBe("123#0002");
        });
    });

    describe("unpublishEntry", () => {
        it("should execute GraphQL mutation for unpublishEntry", async () => {
            const mockResponse = {
                data: {
                    cms: {
                        unpublishEntry: {
                            data: {
                                id: "123#0002",
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

            const result = await sdk.unpublishEntry({
                modelId: "article",
                id: "123#0002"
            });

            expect(result.id).toBe("123#0002");
        });
    });

    describe("error handling", () => {
        it("should throw error for HTTP errors", async () => {
            mockFetch.mockResolvedValue({
                ok: false,
                status: 500
            });

            await expect(
                sdk.getEntry({
                    modelId: "article",
                    where: { id: "123" }
                })
            ).rejects.toThrow("HTTP error! status: 500");
        });

        it("should throw error for GraphQL errors", async () => {
            const mockResponse = {
                errors: [{ message: "GraphQL error occurred" }]
            };

            mockFetch.mockResolvedValue({
                ok: true,
                status: 200,
                json: async () => mockResponse
            });

            await expect(
                sdk.getEntry({
                    modelId: "article",
                    where: { id: "123" }
                })
            ).rejects.toThrow("GraphQL error occurred");
        });
    });
});
