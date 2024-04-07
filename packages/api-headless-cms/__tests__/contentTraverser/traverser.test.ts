import { useHandler } from "~tests/testHelpers/useHandler";
import { CmsModelPlugin } from "~/plugins";
import { articleModel } from "./mocks/article.model";
import { articleEntry } from "./mocks/article.entry";
import { richTextValue } from "~tests/contentTraverser/mocks/richTextValue";

describe("Content Traverser", () => {
    it("should traverse model AST and build flat object with entry values", async () => {
        const { handler, tenant } = useHandler({
            plugins: [new CmsModelPlugin(articleModel)]
        });

        const context = await handler({
            path: "/cms/manage/en-US",
            headers: {
                "x-webiny-cms-endpoint": "manage",
                "x-webiny-cms-locale": "en-US",
                "x-tenant": tenant.id
            }
        });

        const traverser = await context.cms.getEntryTraverser("article");

        const output: Record<string, any> = {};

        const skipFieldTypes = ["object", "dynamicZone"];

        await traverser.traverse(articleEntry, ({ field, value, path }) => {
            if (skipFieldTypes.includes(field.type)) {
                return;
            }

            output[path] = value;
        });

        expect(output).toEqual({
            title: "Article #1",
            body: richTextValue,
            categories: [{ modelId: "category", entryId: "12345678" }],
            "content.0.title": "Hero #1",
            "content.1.nestedObject.objectTitle": "Object title",
            "content.1.nestedObject.objectNestedObject.0.nestedObjectNestedTitle":
                "nestedObjectNestedTitle-0",
            "content.1.nestedObject.objectNestedObject.1.nestedObjectNestedTitle":
                "nestedObjectNestedTitle-1"
        });
    });
});
