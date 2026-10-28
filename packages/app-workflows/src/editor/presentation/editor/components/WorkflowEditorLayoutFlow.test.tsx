import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { fakeViewApp } from "~/editor/testing/fakeViewApp.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import { createDialogVm } from "~/editor/testing/createDialogVm.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});

const app = fakeViewApp;

const STEPS: StepCardVm[] = [
    {
        id: "s1",
        number: 1,
        title: "Editorial check",
        color: "#3B6FD4",
        typeLabel: "People",
        type: "review",
        summary: "Editors",
        description: null,
        readOnly: false,
        warnings: [],
        error: null,
        canMoveUp: false,
        canMoveDown: true
    },
    {
        id: "s2",
        number: 2,
        title: "Legal sign-off",
        color: "#3B6FD4",
        typeLabel: "People",
        type: "review",
        summary: "Legal",
        description: null,
        readOnly: false,
        warnings: [],
        error: null,
        canMoveUp: true,
        canMoveDown: false
    }
];

const HEADER = createWorkflowHeaderVm({ canSave: false });

const renderLayout = (overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}) => {
    const presenter = createFakeEditorViewPresenter(
        createEditorViewModel({ detail: "workflow", header: HEADER, ...overrides })
    );
    const container = new Container();
    container.registerInstance(SortablePresenter, createFakeSortable());
    renderWithContainer(
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<div data-testid="step-drawer" />}
        />,
        container
    );
    return presenter;
};

describe("WorkflowEditorLayout flow", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows the flow of the open workflow under the header", () => {
        renderLayout({ flow: { steps: STEPS, stepsError: null, modelName: "Article" } });

        expect(screen.getByText("Editorial check")).toBeTruthy();
        expect(screen.getByText("Legal sign-off")).toBeTruthy();
    });

    it("shows no flow without an open workflow", () => {
        renderLayout({ detail: "none", header: null });

        expect(screen.queryByTestId("step-card-s1")).toBeNull();
        expect(screen.queryByRole("button", { name: "Add step" })).toBeNull();
    });

    it("mounts the step drawer once", () => {
        renderLayout();

        expect(screen.getAllByTestId("step-drawer")).toHaveLength(1);
    });

    it("opens the step in the drawer through the presenter", () => {
        const presenter = renderLayout({
            flow: { steps: STEPS, stepsError: null, modelName: "Article" }
        });

        const card = screen.getByTestId("step-card-s2");
        fireEvent.click(within(card).getByRole("button", { name: "Edit step" }));

        expect(presenter.openStep).toHaveBeenCalledWith("s2");
    });

    it("sends add, move and delete to the presenter", () => {
        const presenter = renderLayout({
            flow: { steps: STEPS, stepsError: null, modelName: "Article" }
        });

        fireEvent.click(screen.getByRole("button", { name: "Add step" }));
        expect(presenter.openTypePicker).toHaveBeenCalledWith(STEPS.length);

        const first = screen.getByTestId("step-card-s1");
        fireEvent.click(within(first).getByRole("button", { name: "Move down" }));
        expect(presenter.moveStep).toHaveBeenCalledWith(0, 1);

        const second = screen.getByTestId("step-card-s2");
        fireEvent.click(within(second).getByRole("button", { name: "Delete step" }));
        expect(presenter.requestDeleteStep).toHaveBeenCalledWith("s2");
    });

    it("sends nothing to the presenter while a save is in flight (Task 10)", () => {
        const header = createWorkflowHeaderVm({ canSave: false, saving: true });
        const presenter = renderLayout({
            header,
            flow: { steps: STEPS, stepsError: null, modelName: "Article" }
        });

        fireEvent.click(screen.getByRole("button", { name: "Add step" }));
        const first = screen.getByTestId("step-card-s1");
        fireEvent.click(within(first).getByRole("button", { name: "Move down" }));
        const second = screen.getByTestId("step-card-s2");
        fireEvent.click(within(second).getByRole("button", { name: "Delete step" }));

        expect(presenter.openTypePicker).not.toHaveBeenCalled();
        expect(presenter.moveStep).not.toHaveBeenCalled();
        expect(presenter.requestDeleteStep).not.toHaveBeenCalled();
    });

    it("shows the empty flow with its error", () => {
        renderLayout({
            flow: { steps: [], stepsError: "Add at least one step.", modelName: "Article" }
        });

        expect(screen.getByText("No steps yet")).toBeTruthy();
        expect(screen.getByText("Add at least one step.")).toBeTruthy();
    });

    it("scrolls the card the presenter asks for", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        renderLayout({
            flow: { steps: STEPS, stepsError: null, modelName: "Article" },
            scrollRequest: { stepId: "s1", nonce: 7 }
        });

        expect(scroll).toHaveBeenCalledTimes(1);
        expect(scroll.mock.contexts[0]).toBe(screen.getByTestId("step-card-s1"));
    });
    it("shows no type picker while the view model has none", () => {
        renderLayout();

        expect(screen.queryByTestId("step-type-review")).toBeNull();
    });

    it("shows the type picker for the presenter's options", () => {
        renderLayout({
            typePicker: {
                index: 1,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: "Members of one or more teams review.",
                        addable: true,
                        reason: null
                    },
                    {
                        type: "ai",
                        label: "AI",
                        description: "An AI model reviews against your written instructions.",
                        addable: false,
                        reason: "Requires the AI Power-Ups licence."
                    }
                ]
            }
        });

        expect(screen.getByTestId("step-type-review")).toBeTruthy();
        expect(screen.getByText("Requires the AI Power-Ups licence.")).toBeTruthy();
    });

    it("adds the picked type at the stored position", () => {
        const presenter = renderLayout({
            typePicker: {
                index: 1,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: null,
                        addable: true,
                        reason: null
                    }
                ]
            }
        });

        fireEvent.click(screen.getByTestId("step-type-review"));

        expect(presenter.addStep).toHaveBeenCalledTimes(1);
        expect(presenter.addStep).toHaveBeenCalledWith(1, "review");
    });

    it("closes the type picker through the presenter", async () => {
        const presenter = renderLayout({
            typePicker: {
                index: 0,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: null,
                        addable: true,
                        reason: null
                    }
                ]
            }
        });

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(presenter.closeTypePicker).toHaveBeenCalledTimes(1));
    });

    it("does not add a step from the type picker while a save is in flight (Task 10)", () => {
        const header = createWorkflowHeaderVm({ canSave: false, saving: true });
        const presenter = renderLayout({
            header,
            typePicker: {
                index: 1,
                options: [
                    {
                        type: "review",
                        label: "People",
                        description: null,
                        addable: true,
                        reason: null
                    }
                ]
            }
        });

        fireEvent.click(screen.getByTestId("step-type-review"));

        expect(presenter.addStep).not.toHaveBeenCalled();
    });

    it("shows no dialog while the view model has none", () => {
        renderLayout();

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("renders the presenter's dialog and sends its decisions to the presenter", () => {
        const presenter = renderLayout({ dialog: createDialogVm("deleteWorkflow") });

        expect(screen.getByText("Delete workflow?")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(presenter.cancelDialog).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Delete workflow" }));
        expect(presenter.confirmDialog).toHaveBeenCalledTimes(1);
    });

    it("renders a dialog even when no workflow is open", () => {
        renderLayout({ detail: "none", header: null, dialog: createDialogVm("discardChanges") });

        expect(screen.getByText("Discard unsaved changes?")).toBeTruthy();
    });
});
