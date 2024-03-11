/**
 * If number of indexes or names start to
 */
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "./mocks/models";
import { CreateElasticsearchIndexTaskPlugin } from "@webiny/api-elasticsearch-tasks";
import { createIndexesTaskDefinition } from "@webiny/api-elasticsearch-tasks/tasks";
import { ResponseDoneResult } from "@webiny/tasks";
import { Context as TasksContext } from "@webiny/tasks/types";
import { CmsContext } from "~/types";
import { createRunner } from "@webiny/project-utils/testing/tasks";
import { IElasticsearchCreateIndexesTaskInput } from "@webiny/api-elasticsearch-tasks/tasks/createIndexes/types";
import { configurations } from "~/configurations";
import { CmsModel } from "@webiny/api-headless-cms/types";

const createIndexName = (model: Pick<CmsModel, "tenant" | "locale" | "modelId">): string => {
    const { index } = configurations.es({
        model
    });
    return index;
};

interface Context extends TasksContext, CmsContext {}

describe("create index task", () => {
    it("should create an index configuration for each of the models defined", async () => {
        const { handler } = useHandler<Context>({
            plugins: createMockModels()
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": "root"
            }
        });

        const createIndexPlugins = context.plugins.byType<
            CreateElasticsearchIndexTaskPlugin<Context>
        >(CreateElasticsearchIndexTaskPlugin.type);

        expect(createIndexPlugins).toHaveLength(1);

        const plugin = createIndexPlugins[0] as CreateElasticsearchIndexTaskPlugin<Context>;

        const enUsIndexes = await plugin.getIndexList({
            context,
            tenant: "root",
            locale: "en-US"
        });

        expect(enUsIndexes).toHaveLength(7);

        expect(enUsIndexes).toEqual([
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "webinyTask"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "webinyTaskLog"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "car"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "author"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "book"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "category"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "root",
                    locale: "en-US",
                    modelId: "tag"
                }),
                settings: expect.any(Object)
            }
        ]);

        const deIndexes = await plugin.getIndexList({
            context,
            tenant: "dev",
            locale: "de-DE"
        });

        expect(deIndexes).toHaveLength(7);

        expect(deIndexes).toEqual([
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "webinyTask"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "webinyTaskLog"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "car"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "author"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "book"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "category"
                }),
                settings: expect.any(Object)
            },
            {
                index: createIndexName({
                    tenant: "dev",
                    locale: "de-DE",
                    modelId: "tag"
                }),
                settings: expect.any(Object)
            }
        ]);
    });

    it("should create an index for each of the models defined", async () => {
        const createIndexesTask = createIndexesTaskDefinition();
        const { handler, elasticsearch } = useHandler<Context>({
            plugins: [createIndexesTask, ...createMockModels()]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": "root"
            }
        });

        const task = await context.tasks.createTask<IElasticsearchCreateIndexesTaskInput>({
            name: "Create indexes",
            definitionId: createIndexesTask.id,
            input: {
                matching: "-en-us-car"
            }
        });

        const runner = createRunner({
            context,
            task: createIndexesTask
        });

        const result = await runner({
            webinyTaskId: task.id
        });

        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: createIndexesTask.id,
            tenant: "root",
            locale: "en-US",
            message: "Indexes created.",
            output: {
                done: [
                    createIndexName({
                        tenant: "root",
                        locale: "en-US",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "webiny",
                        locale: "en-US",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "dev",
                        locale: "en-US",
                        modelId: "car"
                    }),
                    createIndexName({
                        tenant: "sales",
                        locale: "en-US",
                        modelId: "car"
                    })
                ]
            }
        });
        expect(result).toBeInstanceOf(ResponseDoneResult);

        const doneTask = await context.tasks.getTask(task.id);

        const done: string[] = [
            createIndexName({
                tenant: "root",
                locale: "en-US",
                modelId: "car"
            }),
            createIndexName({
                tenant: "webiny",
                locale: "en-US",
                modelId: "car"
            }),
            createIndexName({
                tenant: "dev",
                locale: "en-US",
                modelId: "car"
            }),
            createIndexName({
                tenant: "sales",
                locale: "en-US",
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
