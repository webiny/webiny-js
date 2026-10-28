import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLClient } from "../abstractions.js";
import { FetchGraphQLClient } from "../FetchGraphQLClient.js";
import { BatchingGraphQLClient } from "../BatchingGraphQLClient.js";
import { RetryGraphQLClient } from "../RetryGraphQLClient.js";
import { EnvConfig } from "~/features/envConfig/index.js";
import { EventPublisher } from "~/features/eventPublisher/index.js";
import { GraphQLExtensionsEvent } from "../GraphQLExtensionsEvent.js";

describe("GraphQLClient Feature", () => {
    let container: Container;
    let mockEnvConfig: EnvConfig.Interface;

    beforeEach(() => {
        container = new Container();

        mockEnvConfig = {
            get: vi.fn((key: string) => {
                if (key === "graphqlApiUrl") {
                    return "https://api.example.com/graphql";
                }
                return undefined;
            })
        } as any;

        container.registerInstance(EnvConfig, mockEnvConfig);

        // The clients announce response extensions through the publisher, so it has to resolve.
        container.registerInstance(EventPublisher, { publish: vi.fn(async () => undefined) });
    });

    describe("FetchGraphQLClient", () => {
        beforeEach(() => {
            container.register(FetchGraphQLClient).inSingletonScope();
        });

        it("should execute a query successfully", async () => {
            const mockResponse = {
                data: { user: { id: "1", name: "John" } }
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query GetUser { user { id name } }"
            });

            expect(result).toEqual(mockResponse.data);
            expect(global.fetch).toHaveBeenCalledWith(
                "https://api.example.com/graphql",
                expect.objectContaining({
                    method: "POST",
                    headers: { "Content-Type": "application/json" }
                })
            );
        });

        it("should publish the response's extensions", async () => {
            const extensions = { debug: { enabled: true, entries: [] } };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => ({ data: { user: null }, extensions })
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query GetUser { user { id } }"
            });

            expect(result).toEqual({ user: null });

            const publish = vi.mocked(container.resolve(EventPublisher).publish);
            expect(publish).toHaveBeenCalledTimes(1);

            const event = publish.mock.calls[0][0];
            expect(event).toBeInstanceOf(GraphQLExtensionsEvent);
            expect(event.payload).toEqual({
                endpoint: "https://api.example.com/graphql",
                operationName: "GetUser",
                extensions
            });
        });

        it("should publish extensions even when the operation failed", async () => {
            const extensions = { debug: { enabled: true, entries: [] } };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => ({ errors: [{ message: "Boom" }], extensions })
            });

            const client = container.resolve(GraphQLClient);
            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query GetUser { user { id } }"
                })
            ).rejects.toThrow("GraphQL errors");

            const publish = vi.mocked(container.resolve(EventPublisher).publish);
            expect(publish).toHaveBeenCalledTimes(1);
            expect(publish.mock.calls[0][0].payload.extensions).toEqual(extensions);
        });

        it("should publish nothing when the response has no extensions", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => ({ data: { user: null } })
            });

            const client = container.resolve(GraphQLClient);
            await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query GetUser { user { id } }"
            });

            expect(container.resolve(EventPublisher).publish).not.toHaveBeenCalled();
        });

        it("should execute a mutation successfully", async () => {
            const mockResponse = {
                data: { createUser: { id: "2", name: "Jane" } }
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "mutation CreateUser($name: String!) { createUser(name: $name) { id name } }",
                variables: { name: "Jane" }
            });

            expect(result).toEqual(mockResponse.data);
        });

        it("should include custom headers", async () => {
            const mockResponse = { data: { user: { id: "1" } } };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query GetUser { user { id } }",
                headers: { "x-tenant": "root", Authorization: "Bearer token" }
            });

            expect(global.fetch).toHaveBeenCalledWith(
                "https://api.example.com/graphql",
                expect.objectContaining({
                    headers: {
                        "Content-Type": "application/json",
                        "x-tenant": "root",
                        Authorization: "Bearer token"
                    }
                })
            );
        });

        it("should throw on network error", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

            const client = container.resolve(GraphQLClient);

            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                })
            ).rejects.toThrow("Network error: Network failure");
        });

        it("should throw on GraphQL errors", async () => {
            const mockResponse = {
                errors: [{ message: "User not found" }],
                data: null
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                })
            ).rejects.toThrow("GraphQL errors");
        });

        it("should return partial data when the response carries both data and errors", async () => {
            const mockResponse = {
                data: { content: { data: [{ id: "1" }, { id: "2" }] } },
                errors: [{ message: "Cannot return null for non-nullable field RefField.id." }]
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query { content { data { id } } }"
            });

            expect(result).toEqual(mockResponse.data);
        });

        it("should throw on invalid JSON response", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                json: async () => {
                    throw new Error("Invalid JSON");
                }
            });

            const client = container.resolve(GraphQLClient);

            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                })
            ).rejects.toThrow("Failed to parse GraphQL response as JSON");
        });
    });

    describe("BatchingGraphQLClient", () => {
        beforeEach(() => {
            container.register(FetchGraphQLClient).inSingletonScope();
            container.registerDecorator(BatchingGraphQLClient);
        });

        it("should batch multiple requests within the batch window", async () => {
            const mockResponse = [
                { data: { user: { id: "1", name: "John" } } },
                { data: { post: { id: "2", title: "Hello" } } }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            const [result1, result2] = await Promise.all([
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query GetUser { user { id name } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query GetPost { post { id title } }"
                })
            ]);

            expect(result1).toEqual(mockResponse[0].data);
            expect(result2).toEqual(mockResponse[1].data);
            expect(global.fetch).toHaveBeenCalledTimes(1);

            const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(callBody).toHaveLength(2);
        });

        it("should publish the extensions of a batched response", async () => {
            const extensions = { debug: { enabled: true, entries: [] } };
            const mockResponse = [
                { data: { user: { id: "1" } } },
                { data: { post: { id: "2" } }, extensions }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await Promise.all([
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query GetUser { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query GetPost { post { id } }"
                })
            ]);

            const publish = vi.mocked(container.resolve(EventPublisher).publish);
            expect(publish).toHaveBeenCalledTimes(1);
            expect(publish.mock.calls[0][0].payload).toEqual({
                endpoint: "https://api.example.com/graphql",
                operationName: "GetPost",
                extensions
            });
        });

        it("should execute single request without batching", async () => {
            const mockResponse = {
                data: { user: { id: "1", name: "John" } }
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query GetUser { user { id name } }"
            });

            expect(result).toEqual(mockResponse.data);

            // Should use decoratee directly for single request
            const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(callBody).toHaveProperty("query");
            expect(callBody).not.toBeInstanceOf(Array);
        });

        it("should handle mixed queries and mutations in batch", async () => {
            const mockResponse = [
                { data: { user: { id: "1" } } },
                { data: { createPost: { id: "2" } } }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await Promise.all([
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "mutation { createPost { id } }"
                })
            ]);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(callBody[0]).toHaveProperty("query");
            expect(callBody[1]).toHaveProperty("query");
        });

        it("should reject all requests if batch fails", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const client = container.resolve(GraphQLClient);

            const promises = [
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { post { id } }"
                })
            ];

            await expect(Promise.all(promises)).rejects.toThrow("Network error");
        });

        it("should handle GraphQL errors in batched operations", async () => {
            const mockResponse = [
                { data: { user: { id: "1" } } },
                { errors: [{ message: "Post not found" }], data: null }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            const promises = [
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { post { id } }"
                })
            ];

            await expect(Promise.all(promises)).rejects.toThrow("GraphQL errors in operation 1");
        });

        it("should return partial data for a batched operation that has data and errors", async () => {
            const mockResponse = [
                { data: { user: { id: "1" } } },
                {
                    data: { content: { data: [{ id: "2" }] } },
                    errors: [{ message: "Cannot return null for non-nullable field RefField.id." }]
                }
            ];

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            const [result1, result2] = await Promise.all([
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { content { data { id } } }"
                })
            ]);

            expect(result1).toEqual(mockResponse[0].data);
            expect(result2).toEqual(mockResponse[1].data);
        });
    });

    describe("RetryGraphQLClient", () => {
        beforeEach(() => {
            container.register(FetchGraphQLClient).inSingletonScope();
            container.registerDecorator(RetryGraphQLClient);
        });

        it("should retry on network errors", async () => {
            const mockResponse = { data: { user: { id: "1" } } };

            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(new Error("Network timeout"))
                .mockRejectedValueOnce(new Error("Network timeout"))
                .mockResolvedValueOnce({
                    status: 200,
                    json: async () => mockResponse
                });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                endpoint: "https://api.example.com/graphql",
                query: "query { user { id } }"
            });

            expect(result).toEqual(mockResponse.data);
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        it("should not retry on GraphQL errors", async () => {
            const mockResponse = {
                errors: [{ message: "Unauthorized" }],
                data: null
            };

            global.fetch = vi.fn().mockResolvedValue({
                status: 200,
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                })
            ).rejects.toThrow("GraphQL errors");

            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it("should give up after max retries", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const client = container.resolve(GraphQLClient);

            await expect(
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                })
            ).rejects.toThrow("Network error");

            // Should try 4 times: initial + 3 retries
            expect(global.fetch).toHaveBeenCalledTimes(4);
        });
    });

    describe("Combined decorators (Retry + Batching)", () => {
        beforeEach(() => {
            container.register(FetchGraphQLClient).inSingletonScope();
            container.registerDecorator(BatchingGraphQLClient);
            container.registerDecorator(RetryGraphQLClient);
        });

        it("should retry batched requests on failure", async () => {
            const mockResponse = [{ data: { user: { id: "1" } } }, { data: { post: { id: "2" } } }];

            global.fetch = vi
                .fn()
                .mockRejectedValueOnce(new Error("Network error"))
                .mockResolvedValueOnce({
                    status: 200,
                    json: async () => mockResponse
                });

            const client = container.resolve(GraphQLClient);

            const [result1, result2] = await Promise.all([
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { user { id } }"
                }),
                client.execute({
                    endpoint: "https://api.example.com/graphql",
                    query: "query { post { id } }"
                })
            ]);

            expect(result1).toEqual(mockResponse[0].data);
            expect(result2).toEqual(mockResponse[1].data);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
