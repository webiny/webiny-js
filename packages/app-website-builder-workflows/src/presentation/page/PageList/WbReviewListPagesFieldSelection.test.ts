import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { ListPagesGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/listPages/abstractions.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WbReviewListPagesFieldSelection } from "./WbReviewListPagesFieldSelection.js";

describe("WbReviewListPagesFieldSelection", () => {
    it("selects system.workflow with the shared selection constant", () => {
        const container = new Container();
        container.register(WbReviewListPagesFieldSelection);

        const selections = container.resolveAll(ListPagesGraphQLFieldSelection);

        expect(selections).toHaveLength(1);
        const fields = selections[0].getSelection();
        expect(fields).toHaveLength(1);
        const normalized = fields[0].replace(/\s+/g, " ").trim();
        expect(normalized).toBe(`system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } }`);
    });

    it("asks for reviewState, not the old state field", () => {
        expect(REVIEW_SYSTEM_WORKFLOW_SELECTION).toBe(
            "workflowId reviewState stepId stepName stepState"
        );
    });
});
