import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GetEntryGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ListEntriesGraphQLFieldSelection } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { CmsReviewGetEntryFieldSelection } from "~/presentation/CmsReviewGetEntryFieldSelection.js";
import { CmsReviewListEntriesFieldSelection } from "~/presentation/CmsReviewListEntriesFieldSelection.js";

const EXPECTED = `meta { system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } } }`;

describe("CMS review field selections", () => {
    it("selects the review shape of system.workflow on the entry list", () => {
        const container = new Container();
        container.register(CmsReviewListEntriesFieldSelection);

        const selection = container.resolve(ListEntriesGraphQLFieldSelection).getSelection();

        expect(selection).toEqual([EXPECTED]);
    });

    it("selects the review shape of system.workflow on an entry read", () => {
        const container = new Container();
        container.register(CmsReviewGetEntryFieldSelection);

        const selection = container.resolve(GetEntryGraphQLFieldSelection).getSelection();

        expect(selection).toEqual([EXPECTED]);
    });

    it("asks for the server's review fields and not the removed state field", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
        expect(EXPECTED).not.toMatch(/\bstate\b/);
    });
});
