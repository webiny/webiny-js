import { describe, expect, it } from "vitest";
import { useHandler } from "~tests/testHelpers/useHandler";
import { articleModel } from "./mocks/article.model";
import { ValuesSelectionGenerator } from "~/features/contentModel/ValuesSelectionGenerator/abstractions";

describe("ValuesSelectionGenerator", () => {
    it("should generate a values selection for the article model", async () => {
        const { handler, tenant } = useHandler({
            plugins: [articleModel]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });

        const generator = context.container.resolve(ValuesSelectionGenerator);
        const model = await context.cms.getModel("article");

        if (!model) {
            throw new Error(`Missing "article" model!`);
        }

        const selection = generator.generate(model);

        // Leaf text field
        expect(selection).toContain("title");
        // Leaf rich-text field
        expect(selection).toContain("body");
        // Ref field with { id modelId } selection
        expect(selection).toContain("categories { id modelId }");

        // Dynamic zone with templates
        // Hero template
        expect(selection).toContain("...on Article_Content_Hero {");
        expect(selection).toContain("_templateId");
        expect(selection).toContain("__typename");

        // SimpleText template
        expect(selection).toContain("...on Article_Content_SimpleText {");

        // Settings template with nested object
        expect(selection).toContain("...on Article_Content_Settings {");
        expect(selection).toContain("settings {");

        // Nested dynamic zone inside Settings template
        expect(selection).toContain("...on Article_Content_Settings_DynamicZone_Ad {");
    });

    it("should return _empty for a model with no fields", async () => {
        const { handler, tenant } = useHandler({
            plugins: [articleModel]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-tenant": tenant.id
            }
        });

        const generator = context.container.resolve(ValuesSelectionGenerator);

        const selection = generator.generate({
            singularApiName: "Empty",
            fields: []
        } as any);

        expect(selection).toBe("_empty");
    });
});
