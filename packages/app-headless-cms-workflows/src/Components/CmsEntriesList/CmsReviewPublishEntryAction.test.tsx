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
import { CompositionProvider } from "@webiny/react-composition";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ContentEntryListConfig } from "@webiny/app-headless-cms/exports/admin/cms/entry/list.js";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { EntryProvider } from "@webiny/app-headless-cms/admin/hooks/useEntry.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import type { ReviewWorkflow } from "@webiny/app-workflows/review/domain/types.js";
import { GetBoundWorkflowUseCase } from "@webiny/app-workflows/review/useCases/getBoundWorkflow/abstractions.js";
import { CmsModelWorkflowFeature } from "~/presentation/modelWorkflow/feature.js";
import { CmsReviewPublishEntryAction } from "./CmsReviewPublishEntryAction.js";
import { MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { IN_REVIEW_REASON } from "~/testing/reviewStates.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";

interface FakeActionProps {
    name: string;
    element: React.ReactElement;
}

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
}

const permission = vi.hoisted(() => {
    return { canPublish: true, canUnpublish: true };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return {
                canPublish: () => permission.canPublish,
                canUnpublish: () => permission.canUnpublish
            };
        }
    };
});

vi.mock("@webiny/app-aco", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-aco")>();
    const React = await import("react");
    const Action = Object.assign(
        (props: FakeActionProps) => {
            return React.createElement("div", { "data-action": props.name }, props.element);
        },
        { OptionsMenuItem: () => null, OptionsMenuLink: () => null }
    );

    return {
        ...actual,
        AcoConfig: {
            ...actual.AcoConfig,
            Record: { ...actual.AcoConfig.Record, Action }
        }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement(
                "button",
                { "data-testid": "blocked-publish", disabled: props.disabled ?? false },
                props.label
            );
        }
    };
});

const EntryAction = ContentEntryListConfig.Browser.Entry.Action;

const WORKFLOW = { id: "workflow-1", namespaces: ["cms.article"] } as unknown as ReviewWorkflow;

function createEntry(reviewState: string | null, status = "draft"): CmsContentEntry {
    const workflow = reviewState === null ? null : { reviewState };

    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        meta: { title: "Hello", status, version: 1, locked: false, system: { workflow } }
    } as unknown as CmsContentEntry;
}

interface RenderParams {
    entry: CmsContentEntry;
    workflow: ReviewWorkflow | null;
    model?: CmsModel;
}

function renderActions(params: RenderParams) {
    const container = new Container();
    const execute = vi.fn<GetBoundWorkflowUseCase.Interface["execute"]>();
    execute.mockResolvedValue(params.workflow);
    container.registerInstance(GetBoundWorkflowUseCase, { execute });
    CmsModelWorkflowFeature.register(container);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={params.model ?? MODEL}>
                        <EntryProvider entry={params.entry}>
                            <CmsReviewPublishEntryAction />
                            <EntryAction
                                name="status"
                                element={<span data-testid="status-item" />}
                            />
                            <EntryAction name="move" element={<span data-testid="move-item" />} />
                        </EntryProvider>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { execute };
}

function getDescription(element: HTMLElement): string | undefined {
    const describedBy = element.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

describe("CmsReviewPublishEntryAction", () => {
    beforeEach(() => {
        permission.canPublish = true;
        permission.canUnpublish = true;
    });

    it("shows Publish disabled with its reason while the revision is in review", async () => {
        renderActions({ entry: createEntry(ReviewState.InProgress), workflow: WORKFLOW });

        await waitFor(() => {
            expect(getDescription(screen.getByTestId("blocked-publish"))).toBe(IN_REVIEW_REASON);
        });
        const blocked = screen.getByTestId("blocked-publish");
        expect(blocked.textContent).toBe("Publish");
        expect(blocked.hasAttribute("disabled")).toBe(true);
        expect(screen.queryByTestId("status-item")).toBeNull();
        expect(screen.getByTestId("move-item")).toBeTruthy();
    });

    it("shows Publish disabled for a draft of a bound model with no review", async () => {
        renderActions({ entry: createEntry(null), workflow: WORKFLOW });

        await waitFor(() => {
            expect(getDescription(screen.getByTestId("blocked-publish"))).toBe(NEEDS_REVIEW);
        });
        expect(screen.queryByTestId("status-item")).toBeNull();
    });

    it("keeps the original action for an approved review", async () => {
        const { execute } = renderActions({
            entry: createEntry(ReviewState.Approved),
            workflow: WORKFLOW
        });

        await waitFor(() => expect(execute).toHaveBeenCalledWith({ namespace: "cms.article" }));
        expect(await screen.findByTestId("status-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps the original action for a model no workflow binds", async () => {
        renderActions({ entry: createEntry(null), workflow: null });

        expect(await screen.findByTestId("status-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps the original Unpublish of a published revision", async () => {
        renderActions({ entry: createEntry(null, "published"), workflow: WORKFLOW });

        expect(await screen.findByTestId("status-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps the original action without the publish permission", async () => {
        permission.canPublish = false;
        renderActions({ entry: createEntry(ReviewState.InProgress), workflow: WORKFLOW });

        expect(await screen.findByTestId("status-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });

    it("keeps the original action for a singleton model", async () => {
        renderActions({
            entry: createEntry(null),
            workflow: WORKFLOW,
            model: SINGLETON_MODEL
        });

        expect(await screen.findByTestId("status-item")).toBeTruthy();
        expect(screen.queryByTestId("blocked-publish")).toBeNull();
    });
});
