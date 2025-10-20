import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container } from "@webiny/di-container";
import { GraphQLClient } from "../abstractions.js";
import { FetchGraphQLClient } from "../FetchGraphQLClient.js";
import { BatchingGraphQLClient } from "../BatchingGraphQLClient.js";
import { RetryGraphQLClient } from "../RetryGraphQLClient.js";
import { EnvConfig } from "~/features/envConfig/index.js";

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
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
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

        it("should execute a mutation successfully", async () => {
            const mockResponse = {
                data: { createUser: { id: "2", name: "Jane" } }
            };

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
                mutation:
                    "mutation CreateUser($name: String!) { createUser(name: $name) { id name } }",
                variables: { name: "Jane" }
            });

            expect(result).toEqual(mockResponse.data);
        });

        it("should include custom headers", async () => {
            const mockResponse = { data: { user: { id: "1" } } };

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            await client.execute({
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

            await expect(client.execute({ query: "query { user { id } }" })).rejects.toThrow(
                "Network error: Network failure"
            );
        });

        it("should throw on GraphQL errors", async () => {
            const mockResponse = {
                errors: [{ message: "User not found" }],
                data: null
            };

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await expect(client.execute({ query: "query { user { id } }" })).rejects.toThrow(
                "GraphQL errors"
            );
        });

        it("should throw on invalid JSON response", async () => {
            global.fetch = vi.fn().mockResolvedValue({
                json: async () => {
                    throw new Error("Invalid JSON");
                }
            });

            const client = container.resolve(GraphQLClient);

            await expect(client.execute({ query: "query { user { id } }" })).rejects.toThrow(
                "Failed to parse GraphQL response as JSON"
            );
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
                client.execute({ query: "query GetUser { user { id name } }" }),
                client.execute({ query: "query GetPost { post { id title } }" })
            ]);

            expect(result1).toEqual(mockResponse[0].data);
            expect(result2).toEqual(mockResponse[1].data);
            expect(global.fetch).toHaveBeenCalledTimes(1);

            const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(callBody).toHaveLength(2);
        });

        it("should execute single request without batching", async () => {
            const mockResponse = {
                data: { user: { id: "1", name: "John" } }
            };

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({
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
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await Promise.all([
                client.execute({ query: "query { user { id } }" }),
                client.execute({ mutation: "mutation { createPost { id } }" })
            ]);

            expect(global.fetch).toHaveBeenCalledTimes(1);
            const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            expect(callBody[0]).toHaveProperty("query");
            expect(callBody[1]).toHaveProperty("mutation");
        });

        it("should reject all requests if batch fails", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const client = container.resolve(GraphQLClient);

            const promises = [
                client.execute({ query: "query { user { id } }" }),
                client.execute({ query: "query { post { id } }" })
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
                client.execute({ query: "query { user { id } }" }),
                client.execute({ query: "query { post { id } }" })
            ];

            await expect(Promise.all(promises)).rejects.toThrow("GraphQL errors in operation 1");
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
                    json: async () => mockResponse
                });

            const client = container.resolve(GraphQLClient);
            const result = await client.execute({ query: "query { user { id } }" });

            expect(result).toEqual(mockResponse.data);
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        it("should not retry on GraphQL errors", async () => {
            const mockResponse = {
                errors: [{ message: "Unauthorized" }],
                data: null
            };

            global.fetch = vi.fn().mockResolvedValue({
                json: async () => mockResponse
            });

            const client = container.resolve(GraphQLClient);

            await expect(client.execute({ query: "query { user { id } }" })).rejects.toThrow(
                "GraphQL errors"
            );

            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it("should give up after max retries", async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

            const client = container.resolve(GraphQLClient);

            await expect(client.execute({ query: "query { user { id } }" })).rejects.toThrow(
                "Network error"
            );

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
                    json: async () => mockResponse
                });

            const client = container.resolve(GraphQLClient);

            const [result1, result2] = await Promise.all([
                client.execute({ query: "query { user { id } }" }),
                client.execute({ query: "query { post { id } }" })
            ]);

            expect(result1).toEqual(mockResponse[0].data);
            expect(result2).toEqual(mockResponse[1].data);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});
