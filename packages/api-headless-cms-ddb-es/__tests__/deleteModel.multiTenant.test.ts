import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createModelPlugin } from "@webiny/api-headless-cms";
import type { CmsContext } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { createTestModelIndexName } from "@webiny/api-headless-cms-utils-os/testing/index.js";
import type { Container } from "@webiny/di";

// @ts-expect-error This is enough for tests.
const productPlugin = createModelPlugin({
    noValidate: true,
    modelId: "product",
    singularApiName: "Product",
    pluralApiName: "Products",
    group: "ecommerce",
    name: "Product",
    description: "Product model",
    fields: [
        {
            id: "name",
            fieldId: "name",
            storageId: "text@name",
            type: "text",
            label: "Name",
            validation: [],
            listValidation: []
        }
    ],
    layout: [],
    titleFieldId: "name"
});

process.env.OPENSEARCH_SHARED_INDEXES = "true";

const getIndex = (container: Container, model: CmsModel) =>
    createTestModelIndexName(container, { model });

const resolveUseCases = (container: Container) => ({
    identityCtx: container.resolve(IdentityContext),
    getModel: container.resolve(GetModelUseCase),
    createEntry: container.resolve(CreateEntryUseCase),
    listLatest: container.resolve(ListLatestEntriesUseCase),
    deleteModelStorage: container.resolve(DeleteModelStorageOperation),
    getProductModel: async (identityCtx: IdentityContext.Interface) => {
        const result = await identityCtx.withoutAuthorization(() =>
            container.resolve(GetModelUseCase).execute("product")
        );
        return result.value;
    }
});

describe("delete model - shared index must survive model deletion", () => {
    const { handler, elasticsearch } = useHandler<CmsContext>({
        plugins: [productPlugin]
    });

    const createContext = () => {
        return handler({
            path: "/cms/manage/en-US",
            headers: { "x-tenant": "root" }
        });
    };

    it("should not destroy shared ES index when model is deleted via storage operations", async () => {
        const context = await createContext();
        const { identityCtx, createEntry, deleteModelStorage, getProductModel } = resolveUseCases(
            context.container
        );

        const model = await getProductModel(identityCtx);

        for (let i = 0; i < 3; i++) {
            await createEntry.execute(model, { values: { name: `Product ${i}` } });
        }

        const index = await getIndex(context.container, model);
        await elasticsearch.indices.refresh({ index });

        expect((await elasticsearch.indices.exists({ index })).body).toBeTrue();
        expect((await elasticsearch.count({ index })).body.count).toBeGreaterThanOrEqual(3);

        await deleteModelStorage.execute({ model: model as CmsModel });

        expect((await elasticsearch.indices.exists({ index })).body).toBeTrue();
        expect((await elasticsearch.count({ index })).body.count).toBeGreaterThanOrEqual(3);
    });

    it("should preserve entries queryable via CMS API after model storage record is deleted", async () => {
        const context = await createContext();
        const { identityCtx, createEntry, listLatest, deleteModelStorage, getProductModel } =
            resolveUseCases(context.container);

        const model = await getProductModel(identityCtx);

        await createEntry.execute(model, { values: { name: "Survivor" } });

        const index = await getIndex(context.container, model);
        await elasticsearch.indices.refresh({ index });

        await deleteModelStorage.execute({ model: model as CmsModel });

        const modelAfter = await getProductModel(identityCtx);
        expect(modelAfter).toBeTruthy();

        const entriesResult = await listLatest.execute(modelAfter, {});
        expect(entriesResult.isOk()).toBe(true);
        const { entries } = entriesResult.value;
        expect(entries).toHaveLength(1);
        expect(entries[0].values.name).toBe("Survivor");
    });
});
