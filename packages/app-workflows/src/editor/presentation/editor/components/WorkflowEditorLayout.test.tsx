import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { Container } from "@webiny/di";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { fakeViewApp } from "~/editor/testing/fakeViewApp.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});

const app = fakeViewApp;

const HEADER = createWorkflowHeaderVm({ dirty: true, canSave: true });

const renderLayout = (overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}) => {
    const presenter = createFakeEditorViewPresenter(createEditorViewModel(overrides));
    const container = new Container();
    container.registerInstance(SortablePresenter, createFakeSortable());
    renderWithContainer(
        <WorkflowEditorLayout presenter={presenter} app={app} drawer={null} />,
        container
    );
    return presenter;
};

describe("WorkflowEditorLayout", () => {
    it("shows the skeleton while loading, without the model panel", () => {
        renderLayout({ status: "loading" });

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();
    });

    it("shows the load error with Try again", () => {
        const presenter = renderLayout({ status: "failed", error: "Network down." });

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Network down.")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retry).toHaveBeenCalledTimes(1);
    });

    it("shows the no-permission state", () => {
        renderLayout({ status: "noAccess" });

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();
    });

    it("shows only the panel when no model is open", () => {
        renderLayout();

        expect(screen.getByTestId("model-panel")).toBeTruthy();
        expect(screen.getByTestId("icon-article")).toBeTruthy();
        expect(screen.queryByText("Create workflow")).toBeNull();
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows a skeleton on the right while a model's workflow loads", () => {
        renderLayout({ detail: "loading" });

        expect(screen.getByTestId("editor-detail-loading")).toBeTruthy();
        expect(screen.getByTestId("model-panel")).toBeTruthy();
    });

    it("shows the no-workflow state and creates a workflow", () => {
        const presenter = renderLayout({
            detail: "empty",
            empty: {
                title: "Article has no workflow",
                description:
                    "Add a workflow to require a review before Article content can be published."
            }
        });

        expect(screen.getByText("Article has no workflow")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Create workflow" }));
        expect(presenter.createWorkflow).toHaveBeenCalledTimes(1);
    });

    it("wires the header to the presenter", async () => {
        const presenter = renderLayout({ detail: "workflow", header: HEADER });

        expect(screen.getByText("Unsaved changes", { selector: "span" })).toBeTruthy();

        fireEvent.change(screen.getByDisplayValue("Article review"), {
            target: { value: "Article sign-off" }
        });
        expect(presenter.setName).toHaveBeenCalledWith("Article sign-off");

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(presenter.save).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(screen.getByRole("button", { name: "More actions" }), { key: "Enter" });
        await screen.findByRole("menuitem", { name: "Delete workflow" });
        fireEvent.click(screen.getByText("Delete workflow"));
        expect(presenter.requestDelete).toHaveBeenCalledTimes(1);
    });

    it("wires the model panel to the presenter", () => {
        const base = createEditorViewModel();
        const presenter = renderLayout({
            panel: { ...base.panel, hasMore: true, error: "Could not load workflows" }
        });

        fireEvent.change(screen.getByPlaceholderText("Search models"), {
            target: { value: "art" }
        });
        expect(presenter.setSearch).toHaveBeenCalledWith("art");

        fireEvent.click(screen.getByText("Article").closest("button") as HTMLElement);
        expect(presenter.selectModel).toHaveBeenCalledWith("article");

        fireEvent.click(screen.getByRole("button", { name: "Load more" }));
        expect(presenter.loadMore).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryModels).toHaveBeenCalledTimes(1);
    });

    it("shows the panel with the app's label and no search for the Website Builder", () => {
        const base = createEditorViewModel();
        renderLayout({ panel: { ...base.panel, label: "Website Builder", showSearch: false } });

        expect(screen.getByText("Website Builder")).toBeTruthy();
        expect(screen.queryByPlaceholderText("Search models")).toBeNull();
    });
});
