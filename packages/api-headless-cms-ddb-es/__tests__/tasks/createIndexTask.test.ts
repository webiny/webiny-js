import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "./mocks/models";
import { createIndexesTaskDefinition } from "@webiny/api-elasticsearch-tasks/tasks";
import type { Context as TasksContext } from "@webiny/background-tasks/api/types";
import type { CmsContext } from "~/types";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import type { IElasticsearchCreateIndexesTaskInput } from "@webiny/api-elasticsearch-tasks/tasks/createIndexes/types";
import { configurations } from "~/configurations";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import type { OpenSearchContext } from "@webiny/api-opensearch/types";
import { OpensearchTenantIndexFactory } from "@webiny/api-elasticsearch-tasks";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

const createIndexName = (model: Pick<CmsModel, "tenant" | "modelId">): string => {
    const { index } = configurations.es({
        model
    });
    return index;
};

interface Context extends TasksContext, CmsContext, OpenSearchContext {}

describe("Create index task", () => {
    it("should create an index configuration for each of the models defined", async () => {
        const { handler } = useHandler<Context>({
            plugins: createMockModels()
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": "root"
            }
        });

        const indexFactories = context.container.resolveAll(OpensearchTenantIndexFactory);

        expect(indexFactories).toHaveLength(1);

        const plugin = indexFactories[0];

        const indexes = (
            await plugin.getIndexList({
                id: "root"
            })
        ).sort((a, b) => (a.index > b.index ? 1 : -1));

        expect(indexes).toHaveLength(7);

        expect(indexes).toEqual(
            [
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "wbyTask"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "wbyTaskLog"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "car"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "author"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "book"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "category"
                    }),
                    settings: expect.any(Object)
                },
                {
                    index: createIndexName({
                        tenant: "root",
                        modelId: "tag"
                    }),
                    settings: expect.any(Object)
                }
            ].sort((a, b) => (a.index > b.index ? 1 : -1))
        );
    });

    it("should create an index for each of the models defined", async () => {
        const { handler, elasticsearch } = useHandler<Context>({
            plugins: [createIndexesTaskDefinition(), ...createMockModels()]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": "root"
            }
        });

        const task = await context.tasks.createTask<IElasticsearchCreateIndexesTaskInput>({
            name: "Create indexes",
            definitionId: "elasticsearchCreateIndexes",
            input: {
                matching: "-car"
            }
        });

        const taskDefinitions = context.container.resolveAll(TaskDefinition);
        const createIndexesTask = taskDefinitions.find(
            task => task.id === "elasticsearchCreateIndexes"
        )!;

        const runner = createRunner({
            context,
            task: createIndexesTask
        });

        await createIndexesTask.onBeforeTrigger!({
            data: {
                input: {
                    matching: "-car"
                },
                name: createIndexesTask.title,
                definitionId: createIndexesTask.id
            }
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: createIndexesTask.id,
            tenant: "root",
            message: "Indexes created.",
            output: {
                done: [
                    createIndexName({
                        tenant: "root",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "webiny",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "dev",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "sales",
                        modelId: "car"
                    })
                ]
            }
        });
        // Note: instanceof checks fail in Vitest when classes are loaded from different module instances
        // Check the status property instead
        expect(result.status).toBe("done");

        const doneTask = await context.tasks.getTask(task.id);

        const done: string[] = [
            createIndexName({
                tenant: "root",
                modelId: "car"
            }),
            createIndexName({
                tenant: "webiny",
                modelId: "car"
            }),
            createIndexName({
                tenant: "dev",
                modelId: "car"
            }),
            createIndexName({
                tenant: "sales",
                modelId: "car"
            })
        ];
        expect(doneTask?.output).toEqual({
            done
        });
        for (const index of done) {
            let result: Record<string, any> = {};
            try {
                result = await elasticsearch.indices?.exists({
                    index
                });
            } catch (ex) {
                result.body = ex.message;
            }
            expect(result?.body).toBeTrue();
        }
    });
});
