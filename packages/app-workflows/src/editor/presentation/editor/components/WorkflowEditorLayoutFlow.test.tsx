import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
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
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

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
        renderLayout({ flow: { steps: STEPS, stepsError: null } });

        expect(screen.getByText("Draft")).toBeTruthy();
        expect(screen.getByText("Editorial check")).toBeTruthy();
        expect(screen.getByText("Legal sign-off")).toBeTruthy();
        expect(screen.getByText("Published")).toBeTruthy();
    });

    it("shows no flow without an open workflow", () => {
        renderLayout({ detail: "none", header: null });

        expect(screen.queryByText("Draft")).toBeNull();
        expect(screen.queryByText("Published")).toBeNull();
    });

    it("mounts the step drawer once", () => {
        renderLayout();

        expect(screen.getAllByTestId("step-drawer")).toHaveLength(1);
    });

    it("opens the step in the drawer through the presenter", () => {
        const presenter = renderLayout({ flow: { steps: STEPS, stepsError: null } });

        const card = screen.getByTestId("step-card-s2");
        fireEvent.click(within(card).getByRole("button", { name: "Edit step" }));

        expect(presenter.openStep).toHaveBeenCalledWith("s2");
    });

    it("sends add, move and delete to the presenter", () => {
        const presenter = renderLayout({ flow: { steps: STEPS, stepsError: null } });

        const connectors = screen.getAllByRole("button", { name: "Add step" });
        fireEvent.click(connectors[1]);
        expect(presenter.openTypePicker).toHaveBeenCalledWith(1);

        const first = screen.getByTestId("step-card-s1");
        fireEvent.click(within(first).getByRole("button", { name: "Move down" }));
        expect(presenter.moveStep).toHaveBeenCalledWith(0, 1);

        const second = screen.getByTestId("step-card-s2");
        fireEvent.click(within(second).getByRole("button", { name: "Delete step" }));
        expect(presenter.requestDeleteStep).toHaveBeenCalledWith("s2");
    });

    it("sends nothing to the presenter while a save is in flight (Task 10)", () => {
        const header = createWorkflowHeaderVm({ canSave: false, saving: true });
        const presenter = renderLayout({ header, flow: { steps: STEPS, stepsError: null } });

        const connectors = screen.getAllByRole("button", { name: "Add step" });
        fireEvent.click(connectors[1]);
        const first = screen.getByTestId("step-card-s1");
        fireEvent.click(within(first).getByRole("button", { name: "Move down" }));
        const second = screen.getByTestId("step-card-s2");
        fireEvent.click(within(second).getByRole("button", { name: "Delete step" }));

        expect(presenter.openTypePicker).not.toHaveBeenCalled();
        expect(presenter.moveStep).not.toHaveBeenCalled();
        expect(presenter.requestDeleteStep).not.toHaveBeenCalled();
    });

    it("shows the empty flow with its error", () => {
        renderLayout({ flow: { steps: [], stepsError: "Add at least one step." } });

        expect(screen.getByText("No steps yet")).toBeTruthy();
        expect(screen.getByText("Add at least one step.")).toBeTruthy();
    });

    it("scrolls the card the presenter asks for", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        renderLayout({
            flow: { steps: STEPS, stepsError: null },
            scrollRequest: { stepId: "s1", nonce: 7 }
        });

        expect(scroll).toHaveBeenCalledTimes(1);
        expect(scroll.mock.contexts[0]).toBe(screen.getByTestId("step-card-s1"));
    });
});
