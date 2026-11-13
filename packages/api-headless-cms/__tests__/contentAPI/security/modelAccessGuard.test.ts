import { describe, expect, it } from "vitest";
import { ContextPlugin } from "@webiny/api";
import { useTestModelHandler } from "~tests/testHelpers/useTestModelHandler";
import { expectNotAuthorized, identityA, identityB } from "./utils";
import { ModelAccessGuard } from "~/features/contentModel/ModelAccessGuard/index.js";
import type { CmsContext } from "~/types/index.js";

/**
 * Registers a guard for the given model. The identity has full access in all tests:
 * the guard alone decides.
 */
const createGuardPlugin = (
    modelId: string,
    canAccess: boolean | ((params: ModelAccessGuard.Params) => boolean)
) => {
    class TestModelAccessGuard implements ModelAccessGuard.Interface {
        canHandle(model: { modelId: string }): boolean {
            return model.modelId === modelId;
        }

        async canAccess(params: ModelAccessGuard.Params): Promise<boolean> {
            return typeof canAccess === "function" ? canAccess(params) : canAccess;
        }
    }

    return new ContextPlugin<CmsContext>(async context => {
        context.container.register(
            ModelAccessGuard.createImplementation({
                implementation: TestModelAccessGuard,
                dependencies: []
            })
        );
    });
};

const setup = async () => {
    const { manage } = useTestModelHandler({ identity: identityA });
    await manage.setup();

    const entry = await manage.createTestEntry();
    expect(entry.error).toBeNull();

    return entry.data;
};

describe("Model access guard", () => {
    it("should deny access to the model and its entries when the guard denies it", async () => {
        const entry = await setup();

        const { manage, read } = useTestModelHandler({
            identity: identityB,
            plugins: [createGuardPlugin("testModel", false)]
        });

        const [models] = await manage.listContentModelsQuery();
        const modelIds = models.data.listContentModels.data.map((model: any) => model.modelId);
        expect(modelIds).not.toContain("testModel");

        const [getModel] = await manage.getContentModelQuery({ modelId: "testModel" });
        expect(getModel.data.getContentModel.data).toBeNull();
        expect(getModel.data.getContentModel.error).not.toBeNull();

        // The model is not accessible, so its types are not part of the schema.
        const [list] = await manage.invoke({
            body: { query: `{ listTestEntries { data { id } error { code message } } }` }
        });
        expect(list.data?.listTestEntries?.data ?? null).toBeNull();

        const [readList] = await read.invoke({
            body: { query: `{ listTestEntries { data { id } error { code message } } }` }
        });
        expect(readList.data?.listTestEntries?.data ?? null).toBeNull();

        const [search] = await manage.invoke({
            body: {
                query: `query Search($modelIds: [ID!]!) {
                    searchContentEntries(modelIds: $modelIds, query: "") {
                        data { id }
                        error { code message }
                    }
                }`,
                variables: { modelIds: ["testModel"] }
            }
        });
        expect(search.data.searchContentEntries.data ?? []).toHaveLength(0);

        const [getEntry] = await manage.invoke({
            body: {
                query: `query Get($entry: CmsModelEntryInput!) {
                    getContentEntry(entry: $entry) {
                        data { id }
                        error { code message }
                    }
                }`,
                variables: { entry: { modelId: "testModel", id: entry.id } }
            }
        });
        expect(getEntry.data.getContentEntry.data).toBeNull();
    });

    it("should not affect the model when the guard allows access", async () => {
        const entry = await setup();

        const { manage } = useTestModelHandler({
            identity: identityB,
            plugins: [createGuardPlugin("testModel", true)]
        });

        const [models] = await manage.listContentModelsQuery();
        const modelIds = models.data.listContentModels.data.map((model: any) => model.modelId);
        expect(modelIds).toContain("testModel");

        const list = await manage.listTestEntries();
        expect(list.error).toBeNull();
        expect(list.data.map(item => item.id)).toEqual([entry.id]);

        const created = await manage.createTestEntry();
        expect(created.error).toBeNull();
    });

    it("should let the guard deny only some kinds of access", async () => {
        const entry = await setup();

        // Reading is allowed, everything else is denied.
        const { manage } = useTestModelHandler({
            identity: identityB,
            plugins: [
                createGuardPlugin("testModel", params => {
                    return !params.pw && (!params.rwd || params.rwd === "r");
                })
            ]
        });

        const list = await manage.listTestEntries();
        expect(list.error).toBeNull();
        expect(list.data.map(item => item.id)).toEqual([entry.id]);

        const created = await manage.createTestEntry();
        expectNotAuthorized(created, {
            code: "Cms/Entry/NotAuthorized",
            message: 'Not allowed to access "testModel" entries.'
        });

        const updated = await manage.updateTestEntry({
            variables: { revision: entry.id, data: {} }
        });
        expect(updated.data).toBeNull();
        expect(updated.error).not.toBeNull();

        const deleted = await manage.deleteTestEntry({
            variables: { revision: entry.entryId }
        });
        expect(deleted.error).not.toBeNull();

        const published = await manage.publishTestEntry({
            variables: { revision: entry.id }
        });
        expect(published.data).toBeNull();
        expect(published.error).not.toBeNull();

        // Nothing was changed or removed.
        const { manage: manageA } = useTestModelHandler({ identity: identityA });
        const after = await manageA.listTestEntries();
        expect(after.data.map(item => item.id)).toEqual([entry.id]);
    });

    it("should not affect other models", async () => {
        const entry = await setup();

        const { manage } = useTestModelHandler({
            identity: identityB,
            plugins: [createGuardPlugin("someOtherModel", false)]
        });

        const list = await manage.listTestEntries();
        expect(list.error).toBeNull();
        expect(list.data.map(item => item.id)).toEqual([entry.id]);
    });
});
