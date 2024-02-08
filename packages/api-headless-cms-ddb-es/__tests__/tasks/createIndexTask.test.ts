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
                index: "api-headless-cms-env-root-headless-cms-en-us-webinytask",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-webinytasklog",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-car",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-author",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-book",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-category",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-root-headless-cms-en-us-tag",
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
                index: "api-headless-cms-env-dev-headless-cms-de-de-webinytask",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-webinytasklog",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-car",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-author",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-book",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-category",
                settings: expect.any(Object)
            },
            {
                index: "api-headless-cms-env-dev-headless-cms-de-de-tag",
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

        expect(result).toBeInstanceOf(ResponseDoneResult);

        const doneTask = await context.tasks.getTask(task.id);

        const done: string[] = [
            "api-headless-cms-env-root-headless-cms-en-us-car",
            "api-headless-cms-env-webiny-headless-cms-en-us-car",
            "api-headless-cms-env-dev-headless-cms-en-us-car",
            "api-headless-cms-env-sales-headless-cms-en-us-car"
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
