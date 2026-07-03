import { describe, expect, it } from "vitest";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import { CmsWorkflowsFeature } from "~/index.js";

const CMS_ENTRY_SYSTEM_FIELDS = /* GraphQL */ `
    {
        __type(name: "CmsEntrySystem") {
            fields {
                name
            }
        }
    }
`;

describe("CmsEntrySystem workflow field", () => {
    it("exposes `workflow` on the CMS manage endpoint's CmsEntrySystem", async () => {
        const { invokeCms } = createCmsTestHandler({
            features: container => {
                CmsWorkflowsFeature.register(container);
            }
        });

        const [body] = await invokeCms({ body: { query: CMS_ENTRY_SYSTEM_FIELDS } });

        const fieldNames: string[] = (body?.data?.__type?.fields ?? []).map(
            (field: { name: string }) => field.name
        );

        expect(fieldNames).toContain("workflow");
    });
});
