import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewWorkflow } from "@webiny/app-workflows/review/domain/types.js";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { BoundWorkflowFeature } from "@webiny/app-workflows/review/presentation/boundWorkflow/feature.js";
import { BulkPublishGate } from "./BulkPublishGate.js";
import { MODEL } from "~/testing/models.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";

interface FakeSelection {
    selectedIds: Set<string>;
    allSelected: boolean;
}

interface FakePagination {
    hasMore: boolean;
}

interface FakeListState {
    rows: CmsContentEntry[];
    selection: FakeSelection;
    pagination: FakePagination;
}

const list = vi.hoisted(() => {
    const state: FakeListState = {
        rows: [],
        selection: { selectedIds: new Set<string>(), allSelected: false },
        pagination: { hasMore: false }
    };
    return state;
});

vi.mock("@webiny/app-headless-cms/exports/admin/cms/entry/list.js", async importOriginal => {
    const actual =
        await importOriginal<
            typeof import("@webiny/app-headless-cms/exports/admin/cms/entry/list.js")
        >();

    return {
        ...actual,
        useContentEntriesPresenter: () => {
            return { list: { vm: list } };
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return { canPublish: () => true };
        }
    };
});

const WORKFLOW = { id: "workflow-1", namespaces: ["cms.article"] } as unknown as ReviewWorkflow;

function createEntry(id: string, reviewState: string | null): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id,
        entryId: id,
        meta: { title: id, status: "draft", version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

function renderGate(workflow: ReviewWorkflow | null) {
    const container = new Container();
    const execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
    execute.mockResolvedValue(workflow);
    container.registerInstance(GetBoundWorkflowUseCase, { execute });
    BoundWorkflowFeature.register(container);

    render(
        <AdminUiProvider>
            <DiContainerProvider container={container}>
                <ModelContext.Provider value={MODEL}>
                    <BulkPublishGate>
                        <span data-testid="bulk-publish" />
                    </BulkPublishGate>
                </ModelContext.Provider>
            </DiContainerProvider>
        </AdminUiProvider>
    );
}

function getDescription(element: HTMLElement): string | undefined {
    const describedBy = element.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

describe("BulkPublishGate", () => {
    beforeEach(() => {
        list.rows = [createEntry("a", ReviewState.Approved), createEntry("b", null)];
        list.selection = { selectedIds: new Set(["a"]), allSelected: false };
    });

    it("keeps the bulk Publish for a selection of approved entries", async () => {
        renderGate(WORKFLOW);

        expect(await screen.findByTestId("bulk-publish")).toBeTruthy();
    });

    it("disables the bulk Publish when a selected entry of a bound model has no review", async () => {
        list.selection = { selectedIds: new Set(["a", "b"]), allSelected: false };
        renderGate(WORKFLOW);

        await waitFor(() => {
            const blocked = screen.getByTestId("cms.bulk.publish.blocked");
            expect(getDescription(blocked)).toBe(NEEDS_REVIEW);
        });
        expect(screen.queryByTestId("bulk-publish")).toBeNull();
    });

    it("keeps the bulk Publish for a model no workflow binds", async () => {
        list.selection = { selectedIds: new Set(["a", "b"]), allSelected: true };
        renderGate(null);

        expect(await screen.findByTestId("bulk-publish")).toBeTruthy();
    });
});
