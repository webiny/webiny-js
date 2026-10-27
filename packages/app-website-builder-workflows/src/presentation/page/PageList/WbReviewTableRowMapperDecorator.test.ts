import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { TableRowMapper as TableRowMapperAbstraction } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/abstractions.js";
import { TableRowMapper as BaseTableRowMapper } from "@webiny/app-website-builder/presentation/pages/PageList/components/Table/TableRowMapper.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import "~/types.js";
import { WbReviewTableRowMapperDecorator } from "./WbReviewTableRowMapperDecorator.js";

const createMapper = (): TableRowMapperAbstraction.Interface => {
    const container = new Container();
    container.register(BaseTableRowMapper);
    container.registerDecorator(WbReviewTableRowMapperDecorator);
    return container.resolve(TableRowMapperAbstraction);
};

const createPage = (reviewState: ReviewStateValue | null): Page => {
    const system =
        reviewState === null
            ? null
            : {
                  workflow: {
                      workflowId: "workflow-1",
                      reviewState,
                      stepId: "step-1",
                      stepName: "Legal",
                      stepState: StepState.InReview
                  }
              };

    return Page.create({
        id: "page-1#0001",
        entryId: "page-1",
        status: WbPageStatus.Draft,
        system
    });
};

interface SelectableCase {
    reviewState: ReviewStateValue | null;
    selectable: boolean;
}

const CASES: SelectableCase[] = [
    { reviewState: null, selectable: true },
    { reviewState: ReviewState.Approved, selectable: true },
    { reviewState: ReviewState.InProgress, selectable: false },
    { reviewState: ReviewState.Rejected, selectable: false },
    { reviewState: ReviewState.Cancelled, selectable: false }
];

describe("WbReviewTableRowMapperDecorator", () => {
    it.each(CASES)(
        "review state $reviewState: selectable is $selectable",
        ({ reviewState, selectable }) => {
            const mapper = createMapper();

            const row = mapper.fromPage(createPage(reviewState));

            expect(row.$selectable).toBe(selectable);
        }
    );

    it("keeps everything else of the base row", () => {
        const mapper = createMapper();

        const row = mapper.fromPage(createPage(ReviewState.InProgress));

        expect(row.id).toBe("page-1");
        expect(row.$type).toBe("RECORD");
    });
});
