import { describe, expect, test } from "vitest";
import { createModelPlugin } from "~/plugins";
import type { CmsModelInput } from "~/plugins";
import { createModelPlugins, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";

const PRIVATE_MODEL_ID = "privateSecretModel";
const SECRET_TITLE = "secret-value-abc";

/**
 * A private model, based on the "category" mock model, with a text field holding a "secret".
 */
const createPrivateModelPlugin = () => {
    const { singularApiName, pluralApiName, ...category } = getCmsModel("category") as any;
    return createModelPlugin({
        ...category,
        modelId: PRIVATE_MODEL_ID,
        name: "Private Secret Model",
        isPrivate: true,
        noValidate: true
    } as CmsModelInput);
};

const setup = async () => {
    const handler = useGraphQLHandler({
        path: "manage",
        plugins: [...createModelPlugins(["category"]), createPrivateModelPlugin()]
    });

    // Any request creates the context; then store one entry in the private model and one in a public one.
    await handler.listContentModelsQuery();
    const context = handler.getContext();

    const privateModel = await context.cms.getModel(PRIVATE_MODEL_ID);
    expect(privateModel?.isPrivate).toBe(true);
    const privateEntry = await context.cms.createEntry(privateModel!, {
        values: { title: SECRET_TITLE, slug: SECRET_TITLE }
    });
    // Published, so the "published" query variants have something to find.
    await context.cms.publishEntry(privateModel!, privateEntry.id);

    const categoryModel = await context.cms.getModel("category");
    const publicEntry = await context.cms.createEntry(categoryModel!, {
        values: { title: "public-value-abc", slug: "public-value-abc" }
    });

    return { handler, privateEntry, publicEntry };
};

describe("Generic manage queries and private models", () => {
    test("searchContentEntries should not search private models", async () => {
        const { handler, publicEntry } = await setup();

        const [privateResponse] = await handler.searchContentEntries({
            modelsIds: [PRIVATE_MODEL_ID],
            fields: ["title"],
            query: "secret"
        });
        expect(privateResponse.data.entries).toEqual({ data: [], error: null });

        // Control: the same query works for a regular model.
        const [publicResponse] = await handler.searchContentEntries({
            modelsIds: ["category"],
            fields: ["title"],
            query: "public"
        });
        expect(publicResponse.data.entries.data.map((item: any) => item.id)).toEqual([
            publicEntry.id
        ]);
    });

    test.each([
        ["getContentEntry", "getContentEntry"],
        ["getLatestContentEntry", "getLatestContentEntry"],
        ["getPublishedContentEntry", "getPublishedContentEntry"]
    ] as const)("%s should treat a private model as unknown", async (_, method) => {
        const { handler, privateEntry } = await setup();

        const [response] = await handler[method]({
            entry: { modelId: PRIVATE_MODEL_ID, id: privateEntry.id }
        });

        expect(response.data[method].data).toBeNull();
        expect(response.data[method].error).toMatchObject({ code: "SECURITY_NOT_AUTHORIZED" });
    });

    test.each([
        ["getContentEntries", "getContentEntries"],
        ["getLatestContentEntries", "getLatestContentEntries"],
        ["getPublishedContentEntries", "getPublishedContentEntries"]
    ] as const)("%s should not return entries of a private model", async (_, method) => {
        const { handler, privateEntry } = await setup();

        const [response] = await handler[method]({
            entries: [{ modelId: PRIVATE_MODEL_ID, id: privateEntry.id }]
        });

        expect(response.data[method].data ?? []).toEqual([]);
    });

    test("getContentModel should not return a private model", async () => {
        const { handler } = await setup();

        const [privateResponse] = await handler.getContentModelQuery({
            modelId: PRIVATE_MODEL_ID
        });
        expect(privateResponse.data.getContentModel.data).toBeNull();
        expect(privateResponse.data.getContentModel.error).toMatchObject({ code: "NOT_FOUND" });

        // Control: regular models are still returned.
        const [publicResponse] = await handler.getContentModelQuery({ modelId: "category" });
        expect(publicResponse.data.getContentModel.data.modelId).toBe("category");
    });

    test("createContentModelFrom should not copy a private model", async () => {
        const { handler } = await setup();

        const [response] = await handler.createContentModelFromMutation({
            modelId: PRIVATE_MODEL_ID,
            data: {
                name: "Copy of private model",
                singularApiName: "CopyOfPrivateModel",
                pluralApiName: "CopiesOfPrivateModel",
                group: "a-sample-content-model-group"
            }
        });

        expect(response.data.createContentModelFrom.data).toBeNull();
        expect(response.data.createContentModelFrom.error).toMatchObject({
            code: "Cms/Model/NotFound"
        });
    });
});
