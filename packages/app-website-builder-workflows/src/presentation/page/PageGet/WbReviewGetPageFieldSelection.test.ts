import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { GetPageGraphQLFieldSelection } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { REVIEW_SYSTEM_WORKFLOW_SELECTION } from "@webiny/app-workflows/review/gateway/reviewFields.js";
import { WbReviewGetPageFieldSelection } from "./WbReviewGetPageFieldSelection.js";

describe("WbReviewGetPageFieldSelection", () => {
    it("selects system.workflow with the shared selection constant", () => {
        const container = new Container();
        container.register(WbReviewGetPageFieldSelection);

        const selections = container.resolveAll(GetPageGraphQLFieldSelection);

        expect(selections).toHaveLength(1);
        const fields = selections[0].getSelection();
        expect(fields).toHaveLength(1);
        const normalized = fields[0].replace(/\s+/g, " ").trim();
        expect(normalized).toBe(`system { workflow { ${REVIEW_SYSTEM_WORKFLOW_SELECTION} } }`);
    });
});
