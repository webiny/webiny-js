import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/context/useHandler";
import { createModelPlugin } from "@webiny/api-headless-cms";
import { configurations } from "~/configurations";
import type { CmsContext } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

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

describe("delete model - shared index must survive model deletion", () => {
    const { handler, elasticsearch } = useHandler<CmsContext>({
        plugins: [productPlugin]
    });

    const createContext = () => {
        return handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-tenant": "root"
            }
        });
    };

    it("should not destroy shared ES index when model is deleted via storage operations", async () => {
        const context = await createContext();
        const model = await context.cms.getModel("product");

        // Create entries so the index gets populated.
        for (let i = 0; i < 3; i++) {
            await context.cms.createEntry(model, {
                values: { name: `Product ${i}` }
            });
        }

        const { index } = configurations.es({ model });
        await elasticsearch.indices.refresh({ index });

        // Verify index exists and has entries.
        const existsBefore = await elasticsearch.indices.exists({ index });
        expect(existsBefore.body).toBeTrue();

        const countBefore = await elasticsearch.count({ index });
        expect(countBefore.body.count).toBeGreaterThanOrEqual(3);

        // Delete model via storage operations.
        // With shared indexes, this index is shared across ALL tenants.
        // Deleting it here would nuke every tenant's product entries.
        await context.cms.storageOperations.models.delete({
            model: model as CmsModel
        });

        // The shared index must still exist after model deletion.
        const existsAfter = await elasticsearch.indices.exists({ index });
        expect(existsAfter.body).toBeTrue();

        // Entries must still be in the index.
        const countAfter = await elasticsearch.count({ index });
        expect(countAfter.body.count).toBeGreaterThanOrEqual(3);
    });

    it("should preserve entries queryable via CMS API after model storage record is deleted", async () => {
        const context = await createContext();
        const model = await context.cms.getModel("product");

        await context.cms.createEntry(model, {
            values: { name: "Survivor" }
        });

        const { index } = configurations.es({ model });
        await elasticsearch.indices.refresh({ index });

        // Delete model record from storage (DDB + ES index).
        await context.cms.storageOperations.models.delete({
            model: model as CmsModel
        });

        // Model still resolves (it's a plugin model).
        const modelAfter = await context.cms.getModel("product");
        expect(modelAfter).toBeTruthy();

        // Entries must still be listable.
        const [entries] = await context.cms.listLatestEntries(modelAfter, {});
        expect(entries).toHaveLength(1);
        expect(entries[0].values.name).toBe("Survivor");
    });
});
