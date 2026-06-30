import { describe, expect, it } from "vitest";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { PageModelPlugin } from "@webiny/api-website-builder/domain/page/page.model.js";
import { RedirectModelPlugin } from "@webiny/api-website-builder/domain/redirect/redirect.model.js";
import { WebsiteBuilderWorkflowsFeature } from "~/index.js";

const WB_PAGE_FIELDS = /* GraphQL */ `
    {
        __type(name: "WbPage") {
            fields {
                name
            }
        }
    }
`;

describe("WbPage.system workflow extension", () => {
    it("exposes `system` on WbPage when the workflows license is active", async () => {
        const { invoke } = createCmsTestHandler({
            // createWebsiteBuilder defines WbPage + CmsEntrySystem on the base /graphql schema.
            plugins: [createWebsiteBuilder()],
            features: container => {
                container.register(PageModelPlugin);
                container.register(RedirectModelPlugin);
                WebsiteBuilderWorkflowsFeature.register(container);
            }
        });

        const [body] = await invoke({ body: { query: WB_PAGE_FIELDS } });

        const fieldNames: string[] = (body?.data?.__type?.fields ?? []).map(
            (field: { name: string }) => field.name
        );

        expect(fieldNames).toContain("system");
    });
});
