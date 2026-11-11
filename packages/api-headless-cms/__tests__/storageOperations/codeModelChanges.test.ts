import { beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { InlineTaskServiceFeature } from "@webiny/api-core-testing";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { ModelFactory } from "~/features/modelBuilder/index.js";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "~/features/contentEntry/ListEntries/index.js";
import {
    MODEL_STORAGE_SYNC_TASK,
    ModelStorageSync,
    type IModelStorageSyncTaskInput
} from "~/features/modelStorageSync/index.js";
import type { CmsEntryListParams } from "~/types/index.js";

const isPg = (process.env.WEBINY_STORAGE || "").split(",").includes("pg");

/**
 * Changing a code model that already has entries. A code field's `storageId` is `{type}@{fieldId}`,
 * so a field removed and added back under the same name finds its old values again.
 *
 * There is no event for a changed code definition: after a deploy, the sync is started by triggering
 * the `cmsModelStorageSync` task with `{ modelId }`, through `TaskService` (as here) or the
 * background tasks GraphQL `triggerTask` mutation. Tasks run inline in this test.
 *
 * Reads go through the use cases, not GraphQL: the GraphQL schema is cached per process by the
 * models' `savedOn`, which a code model doesn't change, so it would keep the first definition. In a
 * deployment, a changed code model comes with a new process.
 */
type Version = "v1" | "v2" | "v3";
let version: Version = "v1";

class ProductModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .public({ modelId: "product", name: "Product", group: "ungrouped" })
                .fields(fields => ({
                    title: fields.text().label("Title"),
                    // v2 removes `code`, v3 brings it back.
                    ...(version === "v2" ? {} : { code: fields.text().label("Code") }),
                    // v3 adds `rank`, which no entry has.
                    ...(version === "v3" ? { rank: fields.number().label("Rank") } : {})
                }))
        ] as any;
    }
}

const ProductModel = ModelFactory.createImplementation({
    implementation: ProductModelImpl,
    dependencies: []
});

describe("Code model changes", () => {
    const handler = useGraphQLHandler({
        path: "manage",
        plugins: [(container: Container) => container.register(ProductModel)],
        afterSetup: container => InlineTaskServiceFeature.register(container)
    });

    /* A fresh request container, so the model is built from the current definition. */
    const product = async () => {
        await handler.invoke({ body: { query: `{ __typename }` } });
        const { container } = handler.getContext();
        const model = await container.resolve(GetModelUseCase).execute("product");
        expect(model.isOk()).toBe(true);
        return { container, model: model.value };
    };

    const create = async (values: Record<string, unknown>) => {
        const { container, model } = await product();
        const result = await container.resolve(CreateEntryUseCase).execute(model, { values });
        expect(result.isOk()).toBe(true);
    };

    const list = async (params: Pick<CmsEntryListParams, "where" | "sort">) => {
        const { container, model } = await product();
        const result = await container
            .resolve(ListLatestEntriesUseCase)
            .execute<{ title: string }>(model, { ...params, limit: 100 });
        if (result.isFail()) {
            throw result.error;
        }
        const { entries, meta } = result.value;
        return { titles: entries.map(entry => entry.values.title), total: meta.totalCount };
    };

    const titles = async (where: Record<string, unknown>) =>
        (await list({ where: { values: where } as CmsEntryListParams["where"] })).titles.sort();

    const needsSync = async () => {
        const { container, model } = await product();
        const [sync] = container.resolveAll(ModelStorageSync);
        return sync ? sync.needsSync(model) : false;
    };

    /* What a deploy script (or someone through GraphQL) does after a code model changed. */
    const triggerSync = async () => {
        const { container } = await product();
        const result = await container.resolve(TaskService).trigger<IModelStorageSyncTaskInput>({
            definition: MODEL_STORAGE_SYNC_TASK,
            input: { modelId: "product" }
        });
        expect(result.isOk()).toBe(true);
        expect(await needsSync()).toBe(false);
    };

    beforeEach(async () => {
        version = "v1";
        await create({ title: "A", code: "red" });
        await create({ title: "B", code: "blue" });
    });

    it("finds old values of a field that is added back, once the sync was triggered", async () => {
        version = "v2";
        expect(await titles({})).toEqual(["A", "B"]);
        await triggerSync();

        version = "v3";
        await triggerSync();
        expect(await titles({ code: "red" })).toEqual(["A"]);
        expect(await titles({ code_in: ["red", "blue"] })).toEqual(["A", "B"]);
        expect(await list({ sort: ["values_code_ASC"] as any })).toEqual({
            titles: ["B", "A"],
            total: 2
        });
    });

    it("lists every entry sorted by a field no entry has, once the sync was triggered", async () => {
        version = "v3";
        await triggerSync();
        const sorted = await list({ sort: ["values_rank_ASC"] as any });
        expect(sorted.total).toBe(2);
        expect(sorted.titles.sort()).toEqual(["A", "B"]);
        expect(await titles({ rank_gt: 0 })).toEqual([]);
    });

    it("lists every entry before the sync is triggered", async () => {
        version = "v2";
        expect(await titles({})).toEqual(["A", "B"]);
        version = "v3";
        expect(await titles({})).toEqual(["A", "B"]);
        const sorted = await list({ sort: ["values_rank_ASC"] as any });
        expect(sorted.total).toBe(2);
        expect(sorted.titles.sort()).toEqual(["A", "B"]);
    });

    /**
     * pg indexes a field that comes back into a new slot, and fills it from the stored
     * values in the sync (model changes spec, §6: "reindex" with new data). Until the sync is
     * triggered, its old values aren't found. UI models trigger it on save; code models need it
     * triggered after the deploy.
     */
    it("finds old values of a field that is added back only once the sync ran (pg)", async () => {
        version = "v2";
        expect(await titles({})).toEqual(["A", "B"]);
        version = "v3";
        expect(await titles({ code: "red" })).toEqual(isPg ? [] : ["A"]);
        await triggerSync();
        expect(await titles({ code: "red" })).toEqual(["A"]);
    });
});
