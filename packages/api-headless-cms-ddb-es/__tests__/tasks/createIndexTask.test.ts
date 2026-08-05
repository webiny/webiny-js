import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createMockModels } from "./mocks/models";
import type { Context as TasksContext } from "@webiny/background-tasks/api/types";
import type { CmsContext } from "~/types";
import { createRunner } from "@webiny/project-utils/testing/tasks/index.js";
import type { CreateIndexesRunner } from "@webiny/api-search-index-tasks";
import { TenantIndexFactory } from "@webiny/api-search-index-tasks";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { createTestModelIndexName } from "@webiny/api-headless-cms-utils-os/testing/index.js";

interface Context extends TasksContext, CmsContext {}

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

        const indexFactories = context.container.resolveAll(TenantIndexFactory);

        expect(indexFactories).toHaveLength(1);

        const plugin = indexFactories[0];

        const indexes = (
            await plugin.getIndexList({
                id: "root"
            })
        ).sort((a, b) => (a.index > b.index ? 1 : -1));

        expect(indexes).toHaveLength(8);

        const indexName = (model: { tenant: string; modelId: string }) =>
            createTestModelIndexName(context.container, { model: model as any });

        const expectedIndexes = await Promise.all(
            [
                "wbyTask",
                "wbyTaskLog",
                "car",
                "author",
                "book",
                "category",
                "tag",
                "backgroundtasksettings"
            ].map(async modelId => ({
                index: await indexName({ tenant: "root", modelId }),
                settings: expect.any(Object)
            }))
        );

        expect(indexes).toEqual(expectedIndexes.sort((a, b) => (a.index > b.index ? 1 : -1)));
    });

    it("should create an index for each of the models defined", async () => {
        const { handler, elasticsearch } = useHandler<Context>({
            plugins: createMockModels()
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": "root"
            }
        });

        const task = await context.tasks.createTask<CreateIndexesRunner.Input>({
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

        const indexName = (model: { tenant: string; modelId: string }) =>
            createTestModelIndexName(context.container, { model: model as any });

        const done: string[] = await Promise.all([
            indexName({ tenant: "root", modelId: "car" }),
            indexName({ tenant: "webiny", modelId: "car" }),
            indexName({ tenant: "dev", modelId: "car" }),
            indexName({ tenant: "sales", modelId: "car" })
        ]);

        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: createIndexesTask.id,
            tenant: "root",
            message: "Indexes created.",
            output: {
                done: expect.arrayContaining(done)
            }
        });
        expect(result.status).toBe("done");

        const doneTask = await context.tasks.getTask(task.id);
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
