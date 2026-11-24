import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewStateValue } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { StepState } from "@webiny/app-workflows/review/domain/StepState.js";
import type { ReviewWorkflow } from "@webiny/app-workflows/review/domain/types.js";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import "~/types.js";
import { PageBulkPublishGate } from "./PageBulkPublishGate.js";

interface FakeListVm {
    rows: Page[];
    selection: { selectedIds: Set<string>; allSelected: boolean };
    pagination: { hasMore: boolean };
}

const list = vi.hoisted(() => {
    return { vm: null as unknown as FakeListVm };
});

vi.mock(
    "@webiny/app-website-builder/presentation/pages/PageList/PageListPresenterProvider.js",
    () => {
        return {
            usePageListPresenter: () => {
                return { list: { vm: list.vm } };
            }
        };
    }
);

const WORKFLOW = { id: "workflow-1", namespaces: ["wb.page"] } as unknown as ReviewWorkflow;
const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";

const createPage = (
    entryId: string,
    reviewState: ReviewStateValue | null,
    status: WbStatus = "draft"
): Page => {
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
    return Page.create({ id: `${entryId}#0001`, entryId, status, system });
};

interface MountParams {
    rows: Page[];
    workflow: ReviewWorkflow | null;
    allSelected?: boolean;
    hasMore?: boolean;
}

const mountGate = (params: MountParams) => {
    list.vm = {
        rows: params.rows,
        selection: {
            selectedIds: new Set(params.rows.map(row => row.entryId)),
            allSelected: params.allSelected ?? false
        },
        pagination: { hasMore: params.hasMore ?? false }
    };
    const container = new Container();
    const execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
    execute.mockResolvedValue(params.workflow);
    container.registerInstance(GetBoundWorkflowUseCase, { execute });
    BoundWorkflowFeature.register(container);

    render(
        <AdminUiProvider>
            <DiContainerProvider container={container}>
                <PageBulkPublishGate element={<span data-testid={"bulk-publish"} />} />
            </DiContainerProvider>
        </AdminUiProvider>
    );

    return { execute };
};

function getDescription(element: HTMLElement): string | undefined {
    const describedBy = element.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

describe("PageBulkPublishGate", () => {
    afterEach(() => {
        cleanup();
    });

    it("disables the bulk Publish with its reason for a selected page with no review", async () => {
        const { execute } = mountGate({
            rows: [createPage("a", ReviewState.Approved), createPage("b", null)],
            workflow: WORKFLOW
        });

        await waitFor(() => expect(execute).toHaveBeenCalledWith({ namespace: "wb.page" }));
        await waitFor(() => {
            const blocked = screen.getByTestId("wb.page-list.bulk.publish.blocked");
            expect(getDescription(blocked)).toBe(NEEDS_REVIEW);
        });
        expect(screen.queryByTestId("bulk-publish")).toBeNull();
    });

    it("keeps the bulk Publish for approved pages", async () => {
        mountGate({ rows: [createPage("a", ReviewState.Approved)], workflow: WORKFLOW });

        expect(await screen.findByTestId("bulk-publish")).toBeTruthy();
    });

    it("keeps the bulk Publish when no workflow binds the pages", async () => {
        mountGate({
            rows: [createPage("a", null)],
            workflow: null,
            allSelected: true,
            hasMore: true
        });

        expect(await screen.findByTestId("bulk-publish")).toBeTruthy();
    });

    it("skips a selected published page", async () => {
        mountGate({
            rows: [createPage("a", null, "published"), createPage("b", ReviewState.Approved)],
            workflow: WORKFLOW
        });

        expect(await screen.findByTestId("bulk-publish")).toBeTruthy();
    });

    it("disables the bulk Publish with every page selected and more to load", async () => {
        mountGate({
            rows: [createPage("a", ReviewState.Approved)],
            workflow: WORKFLOW,
            allSelected: true,
            hasMore: true
        });

        await waitFor(() => {
            const blocked = screen.getByTestId("wb.page-list.bulk.publish.blocked");
            expect(getDescription(blocked)).toBe(NEEDS_REVIEW);
        });
    });
});
