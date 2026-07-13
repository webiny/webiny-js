import { describe, expect, it } from "vitest";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
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
            // WebsiteBuilderFeature defines WbPage + CmsEntrySystem on the base /graphql schema.
            features: container => {
                WebsiteBuilderFeature.register(container);
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
