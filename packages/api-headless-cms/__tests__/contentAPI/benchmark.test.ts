import { describe, it, expect, beforeEach, vi } from "vitest";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { BenchmarkAbstraction } from "@webiny/api";
import type { Container } from "@webiny/di";
import { createIcon } from "~tests/__helpers/icon.js";

describe("benchmark points", () => {
    let elapsed = 0;

    const { createContentModelGroupMutation } = useGraphQLHandler({
        path: "manage",
        // The benchmark is registered by HeadlessCmsFeature, so enable it once the CMS is set up.
        // It's the same instance createCmsRoute flushes at the end of the request.
        afterSetup: (container: Container) => {
            const benchmark = container.resolve(BenchmarkAbstraction);
            benchmark.enable();

            benchmark.onOutput(async ({ benchmark }: any) => {
                elapsed = benchmark.elapsed;
            });
        }
    });
    beforeEach(async () => {
        elapsed = 0;
    });

    it("should run benchmark and have required points present in the log", async () => {
        const logs: any[] = [];
        vi.spyOn(console, "log").mockImplementation((...args) => {
            logs.push(...args);
        });

        const data = {
            name: "My group",
            slug: "my-group",
            icon: createIcon("fas/star"),
            description: "My group description"
        };
        const [result] = await createContentModelGroupMutation({
            data: {
                ...data
            }
        });
        expect(result).toMatchObject({
            data: {
                createContentModelGroup: {
                    data: {
                        ...data
                    },
                    error: null
                }
            }
        });

        expect(logs).toHaveLength(3);
        // The GraphQL request flow is measured at the graphql layer (getSchema ->
        // createRequestBody -> processRequestBody). Per-operation CRUD measures live on the
        // HeadlessCms facade, which the DI resolvers no longer route through, so they are not
        // part of the request's benchmark output.
        expect(logs).toMatchObject([
            `Benchmark total time elapsed: ${elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.getSchema",
                    category: "webiny",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.createRequestBody",
                    category: "webiny",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.processRequestBody",
                    category: "webiny",
                    start: expect.any(Date)
                }
            ]
        ]);
    });
});
