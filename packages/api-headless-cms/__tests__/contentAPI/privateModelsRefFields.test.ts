import { describe, expect, test } from "vitest";
import { createModelPlugin } from "~/plugins";
import type { CmsModelInput } from "~/plugins";
import { createModelPlugins, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { useProductManageHandler } from "~tests/testHelpers/useProductManageHandler";
import { useProductReadHandler } from "~tests/testHelpers/useProductReadHandler";

const PRIVATE_MODEL_ID = "privateSecretModel";
const SECRET_TITLE = "secret-value-abc";

/**
 * A private model, based on the "category" mock model, so its entries fit the product's category reference.
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

const createPlugins = () => {
    return [...createModelPlugins(["category", "product"]), createPrivateModelPlugin()];
};

const productValues = (category: { id: string; modelId: string }) => {
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

const setup = async () => {
    const manager = useProductManageHandler({ path: "manage", plugins: createPlugins() });
    const reader = useProductReadHandler({ path: "read", plugins: createPlugins() });

    // Any request creates the context; then store one published entry in the private model and in "category".
    await manager.listContentModelsQuery();
    const context = manager.getContext();

    const privateModel = await context.cms.getModel(PRIVATE_MODEL_ID);
    expect(privateModel?.isPrivate).toBe(true);
    const privateEntry = await context.cms.createEntry(privateModel!, {
        values: { title: SECRET_TITLE, slug: SECRET_TITLE }
    });
    await context.cms.publishEntry(privateModel!, privateEntry.id);

    const categoryModel = await context.cms.getModel("category");
    const publicEntry = await context.cms.createEntry(categoryModel!, {
        values: { title: "public-value-abc", slug: "public-value-abc" }
    });
    await context.cms.publishEntry(categoryModel!, publicEntry.id);

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
        expect(response.data.createProduct.error).toMatchObject({ code: "ENTRY_NOT_FOUND" });
    });

    test("a stored reference to a private model entry is not resolved", async () => {
        const { manager, reader, privateEntry, publicEntry } = await setup();

        const [createResponse] = await manager.createProduct({
            data: {
                values: productValues({ id: publicEntry.id, modelId: "category" })
            }
        });
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

        const [publishResponse] = await manager.publishProduct({ revision: productId });
        expect(publishResponse.data.publishProduct.error).toBeNull();

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
        const productId = createResponse.data.createProduct.data.id;
        await manager.publishProduct({ revision: productId });

        const [readResponse] = await reader.getProduct({
            where: { id: productId }
        });
        expect(readResponse.data.getProduct.data.values.category).toMatchObject({
            id: publicEntry.id,
            values: { title: "public-value-abc" }
        });
    });
});
