import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { ContextPlugin } from "@webiny/api";

describe("benchmark points", () => {
    let elapsed = 0;

    const { createContentModelGroupMutation } = useGraphQLHandler({
        path: "manage/en-US",
        topPlugins: [
            new ContextPlugin(async context => {
                context.benchmark.enable();

                context.benchmark.onOutput(async benchmark => {
                    elapsed = benchmark.elapsed;
                });
            })
        ]
    });
    beforeEach(async () => {
        elapsed = 0;
    });

    it("should run benchmark and have required points present in the log", async () => {
        const logs: any[] = [];
        jest.spyOn(console, "log").mockImplementation((...args) => {
            logs.push(...args);
        });

        const data = {
            name: "My group",
            slug: "my-group",
            icon: "fas/star",
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
        expect(logs).toMatchObject([
            `Benchmark total time elapsed: ${elapsed}ms`,
            "Benchmark measurements:",
            [
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.createContext",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.crud.models.listModels",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.getSchema",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.createRequestBody",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.crud.groups.createGroup",
                    start: expect.any(Date)
                },
                {
                    elapsed: expect.any(Number),
                    end: expect.any(Date),
                    memory: expect.any(Number),
                    name: "headlessCms.graphql.processRequestBody",
                    start: expect.any(Date)
                }
            ]
        ]);
    });
});
