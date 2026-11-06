import { describe, expect, test } from "vitest";
import type { Container } from "@webiny/di";
import { createPrivateModelPlugin } from "~/plugins";
import { createModelField } from "~/utils/createModelField";
import { createModelPlugins } from "~tests/contentAPI/mocks/contentModels";
import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";
import { useProductReadHandler } from "~tests/testHelpers/useProductReadHandler";
import { GetModelUseCase } from "~/features/contentModel/GetModel/index.js";
import { CreateEntryUseCase } from "~/features/contentEntry/CreateEntry/index.js";
import { PublishEntryUseCase } from "~/features/contentEntry/PublishEntry/index.js";
import type { CmsEntry } from "~/types";

const PRIVATE_MODEL_ID = "privateSecretModel";
const SECRET_TITLE = "secret-value-abc";
const PUBLIC_TITLE = "public-value-abc";

/**
 * A private model with the same fields as the "category" mock model, so its entries fit the
 * product's category reference.
 */
const createPlugins = () => {
    return [
        ...createModelPlugins(["category", "product"]),
        createPrivateModelPlugin({
            modelId: PRIVATE_MODEL_ID,
            name: "Private Secret Model",
            titleFieldId: "title",
            fields: [
                createModelField({ id: "title", fieldId: "title", type: "text", label: "Title" }),
                createModelField({ id: "slug", fieldId: "slug", type: "text", label: "Slug" })
            ]
        })
    ];
};

interface ProductCategoryRef {
    id: string;
    modelId: string;
}

const productValues = (category: ProductCategoryRef) => {
    return {
        title: "Potato",
        price: 99.9,
        availableOn: "2020-12-25",
        color: "white",
        image: "image.png",
        availableSizes: ["s", "m"],
        category
    };
};

const createPublishedEntry = async (
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
    const published = await container
        .resolve(PublishEntryUseCase)
        .execute(model.value, created.value.id);
    if (published.isFail()) {
        throw published.error;
    }
    return published.value;
};

const setup = async () => {
    const manager = useProductManageHandler({ path: "manage", plugins: createPlugins() });
    const reader = useProductReadHandler({ path: "read", plugins: createPlugins() });

    // Any request creates the request container; then store one published entry in the private
    // model and one in "category".
    await manager.listContentModelsQuery();
    const container: Container = manager.getContext().container;

    const privateEntry = await createPublishedEntry(container, PRIVATE_MODEL_ID, SECRET_TITLE);
    const publicEntry = await createPublishedEntry(container, "category", PUBLIC_TITLE);

    return { manager, reader, privateEntry, publicEntry };
};

describe("Reference fields and private models", () => {
    test("creating an entry with a reference to a private model entry fails as a missing entry", async () => {
        const { manager, privateEntry } = await setup();

        const [response] = await manager.createProduct({
            data: {
                values: productValues({ id: privateEntry.id, modelId: PRIVATE_MODEL_ID })
            }
        });

        expect(response.data.createProduct.data).toBeNull();
        expect(response.data.createProduct.error).toMatchObject({
            code: "ENTRY_NOT_FOUND",
            message: `Missing referenced entry with id "${privateEntry.id}" in model "${PRIVATE_MODEL_ID}".`
        });
    });

    test("creating an entry with a reference to an unknown model is still allowed", async () => {
        const { manager } = await setup();

        const [response] = await manager.createProduct({
            data: {
                values: productValues({ id: "unknownEntry#0001", modelId: "unknownModel" })
            }
        });

        expect(response.data.createProduct.error).toBeNull();
        expect(response.data.createProduct.data.id).toEqual(expect.any(String));
    });

    test("a stored reference to a private model entry is not resolved", async () => {
        const { manager, reader, privateEntry, publicEntry } = await setup();

        const [createResponse] = await manager.createProduct({
            data: {
                values: productValues({ id: publicEntry.id, modelId: "category" })
            }
        });
        expect(createResponse.data.createProduct.error).toBeNull();
        const productId = createResponse.data.createProduct.data.id;

        // Updates don't verify that referenced entries exist, so the reference is stored.
        const [updateResponse] = await manager.updateProduct({
            revision: productId,
            data: {
                values: {
                    category: { id: privateEntry.id, modelId: PRIVATE_MODEL_ID }
                }
            }
        });
        expect(updateResponse.data.updateProduct.error).toBeNull();

        // Manage API returns the stored reference only, never the referenced entry's values.
        const [manageResponse] = await manager.getProduct({ revision: productId });
        expect(manageResponse.data.getProduct.error).toBeNull();
        expect(manageResponse.data.getProduct.data.values.category).toMatchObject({
            modelId: PRIVATE_MODEL_ID
        });
        expect(JSON.stringify(manageResponse)).not.toContain(SECRET_TITLE);

        const [publishResponse] = await manager.publishProduct({ revision: productId });
        expect(publishResponse.data.publishProduct.error).toBeNull();

        // Read API: resolved through GetPublishedEntriesByIds.
        const [readResponse] = await reader.getProduct({
            where: { id: productId }
        });
        expect(readResponse.data.getProduct.error).toBeNull();
        expect(readResponse.data.getProduct.data.values.category).toBeNull();
        expect(JSON.stringify(readResponse)).not.toContain(SECRET_TITLE);
    });

    test("a reference to a regular model entry is still resolved", async () => {
        const { manager, reader, publicEntry } = await setup();

        const [createResponse] = await manager.createProduct({
            data: {
                values: productValues({ id: publicEntry.id, modelId: "category" })
            }
        });
        expect(createResponse.data.createProduct.error).toBeNull();
        const productId = createResponse.data.createProduct.data.id;
        await manager.publishProduct({ revision: productId });

        const [readResponse] = await reader.getProduct({
            where: { id: productId }
        });
        expect(readResponse.data.getProduct.data.values.category).toMatchObject({
            id: publicEntry.id,
            values: { title: PUBLIC_TITLE }
        });
    });
});
