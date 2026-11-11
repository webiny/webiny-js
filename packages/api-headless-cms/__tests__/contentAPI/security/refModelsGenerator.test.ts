import { describe, expect, it } from "vitest";
import { createModelPlugin } from "~/plugins";
import type { CmsModelInput } from "~/plugins";
import type { CmsModel } from "~/types";
import { createModelPlugins, getCmsModel } from "~tests/contentAPI/mocks/contentModels";
import { useGraphQLHandler } from "~tests/testHelpers/useGraphQLHandler";
import type { PermissionsArg } from "~tests/testHelpers/helpers";
import { RefModelsGenerator } from "~/features/contentModel/RefModelsGenerator/abstractions.js";

const PRIVATE_MODEL_ID = "privateSecretModel";

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

const setup = async (permissions?: PermissionsArg[]) => {
    const handler = useGraphQLHandler({
        path: "manage",
        identity: { id: "ref-models", type: "admin", displayName: "Ref Models" },
        permissions,
        plugins: [...createModelPlugins(["category", "product"]), createPrivateModelPlugin()]
    });

    // Any request creates the context.
    await handler.listContentModelsQuery();
    const context = handler.getContext();
    const product = (await context.security.withoutAuthorization(() => {
        return context.cms.getModel("product");
    })) as CmsModel;
    expect(product.modelId).toEqual("product");

    const generator = context.container.resolve(RefModelsGenerator);

    return { product, generator };
};

describe("RefModelsGenerator access control", () => {
    it("should return referenced models the identity can read", async () => {
        const { product, generator } = await setup();

        const refModels = await generator.generate(product);

        expect(Object.keys(refModels)).toContain("category");
    });

    it("should not return referenced models the identity cannot read", async () => {
        const { product, generator } = await setup([
            { name: "cms.endpoint.manage" },
            { name: "cms.contentModelGroup", rwd: "r" },
            { name: "cms.contentModel", rwd: "r", models: ["product"] },
            { name: "cms.contentEntry", rwd: "r" }
        ]);

        const refModels = await generator.generate(product);

        expect(Object.keys(refModels)).not.toContain("category");
    });

    it("should not return private referenced models", async () => {
        const { product, generator } = await setup();

        const productReferencingPrivateModel: CmsModel = {
            ...product,
            fields: product.fields.map(field => {
                if (field.type !== "ref") {
                    return field;
                }
                return {
                    ...field,
                    settings: {
                        ...field.settings,
                        models: [{ modelId: PRIVATE_MODEL_ID }]
                    }
                };
            })
        };

        const refModels = await generator.generate(productReferencingPrivateModel);

        expect(Object.keys(refModels)).not.toContain(PRIVATE_MODEL_ID);
    });
});
