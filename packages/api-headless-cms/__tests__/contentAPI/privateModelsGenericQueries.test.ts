import { describe, expect, test } from "vitest";
import type { Container } from "@webiny/di";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { createPluginFromCmsModel, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import type { CmsEntry } from "~/types";

const PRIVATE_MODEL_ID = "privateSecretModel";
const SECRET_TITLE = "secret-value-abc";
const PUBLIC_TITLE = "public-value-abc";

/**
 * A private model with a text field holding a "secret".
 */
const privateModelPlugin = createPrivateModelPlugin({
    modelId: PRIVATE_MODEL_ID,
    name: "Private Secret Model",
    titleFieldId: "title",
    fields: [
        createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" }),
        createModelField({ id: "slug", fieldId: "slug", type: "text", label: "Slug" })
    ]
});

const plugins = [...createPluginFromCmsModel(getCmsModel("category")), privateModelPlugin];

const createEntry = async (
    container: Container,
    modelId: string,
    title: string
): Promise<CmsEntry> => {
    const model = await container.resolve(GetModelUseCase).execute(modelId);
    if (model.isFail()) {
        throw model.error;
    }
    const created = await container
        .resolve(CreateEntryUseCase)
        .execute(model.value, { values: { title, slug: title } });
    if (created.isFail()) {
        throw created.error;
    }
    // Published, so the "published" query variants have something to find.
    const published = await container
        .resolve(PublishEntryUseCase)
        .execute(model.value, created.value.id);
    if (published.isFail()) {
        throw published.error;
    }
    return published.value;
};

const setup = async () => {
    const handler = useGraphQLHandler({ path: "manage", plugins });

    // Any request creates the request container; then store one entry in the private model and
    // one in a public one.
    await handler.listContentModelsQuery();
    const container: Container = handler.getContext().container;

    const privateEntry = await createEntry(container, PRIVATE_MODEL_ID, SECRET_TITLE);
    const publicEntry = await createEntry(container, "category", PUBLIC_TITLE);

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
        expect(publicResponse.data.entries.data.map((item: { id: string }) => item.id)).toEqual([
            publicEntry.id
        ]);
    });

    test.each([
        ["getContentEntry", "getContentEntry"],
        ["getLatestContentEntry", "getLatestContentEntry"],
        ["getPublishedContentEntry", "getPublishedContentEntry"]
    ] as const)("%s should treat a private model as unknown", async (_, method) => {
        const { handler, privateEntry, publicEntry } = await setup();

        const [response] = await handler[method]({
            entry: { modelId: PRIVATE_MODEL_ID, id: privateEntry.id }
        });

        expect(response.data[method].data).toBeNull();
        expect(response.data[method].error).toMatchObject({ code: "SECURITY_NOT_AUTHORIZED" });

        // Control: regular models still work.
        const [publicResponse] = await handler[method]({
            entry: { modelId: "category", id: publicEntry.id }
        });
        expect(publicResponse.data[method].error).toBeNull();
        expect(publicResponse.data[method].data).toMatchObject({ entryId: publicEntry.entryId });
    });

    test.each([
        ["getContentEntries", "getContentEntries"],
        ["getLatestContentEntries", "getLatestContentEntries"],
        ["getPublishedContentEntries", "getPublishedContentEntries"]
    ] as const)("%s should not return entries of a private model", async (_, method) => {
        const { handler, privateEntry, publicEntry } = await setup();

        const [response] = await handler[method]({
            entries: [{ modelId: PRIVATE_MODEL_ID, id: privateEntry.id }]
        });
        expect(response.data[method].data ?? []).toEqual([]);

        // Mixed: only the regular model's entry is returned.
        const [mixedResponse] = await handler[method]({
            entries: [
                { modelId: PRIVATE_MODEL_ID, id: privateEntry.id },
                { modelId: "category", id: publicEntry.id }
            ]
        });
        expect(mixedResponse.data[method].error).toBeNull();
        expect(
            mixedResponse.data[method].data.map((item: { entryId: string }) => item.entryId)
        ).toEqual([publicEntry.entryId]);
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

    test("cms.getModel should not return a private model", async () => {
        const handler = useGraphQLHandler({ plugins });

        const query = /* GraphQL */ `
            query GetModel($modelId: ID!) {
                cms {
                    getModel(modelId: $modelId) {
                        data
                        error {
                            message
                            code
                        }
                    }
                }
            }
        `;

        // The unified CMS API is served by the core GraphQL route, not the per-model `/cms/*` one.
        const invokeGetModel = async (modelId: string) => {
            const response = await handler.handler({
                method: "POST",
                path: "/graphql",
                headers: {
                    "x-tenant": "root",
                    "content-type": "application/json"
                },
                body: { query, variables: { modelId } }
            });
            return response.body as Record<string, any>;
        };

        const privateResponse = await invokeGetModel(PRIVATE_MODEL_ID);
        expect(privateResponse.data.cms.getModel).toEqual({
            data: null,
            error: {
                message: `Model "${PRIVATE_MODEL_ID}" not found`,
                code: "GET_MODEL_ERROR"
            }
        });

        // Control: regular models are still returned.
        const publicResponse = await invokeGetModel("category");
        expect(publicResponse.data.cms.getModel.data.modelId).toBe("category");
    });
});
