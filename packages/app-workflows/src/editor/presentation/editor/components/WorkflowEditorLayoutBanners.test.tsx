import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createOptionsBannerVm } from "~/editor/testing/createBannerVm.js";
import { createSaveBannerVm } from "~/editor/testing/createBannerVm.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { fakeViewApp } from "~/editor/testing/fakeViewApp.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";
import { useLeaveGuard } from "./useLeaveGuard.js";

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

describe("WorkflowEditorLayout banners", () => {
    it("shows no banner while the view model has none", () => {
        renderLayout({ detail: "workflow", header: HEADER });

        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("shows the save banner under the header of the open workflow", () => {
        renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("transport")
        });

        const header = screen.getByDisplayValue("Article review");
        const banner = screen.getByTestId("transport-banner");
        expect(
            header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(screen.getByText("Could not save the workflow")).toBeTruthy();
    });

    it("sends the transport banner's retry and dismissal to the presenter", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("transport")
        });

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retrySave).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(presenter.dismissBanner).toHaveBeenCalledTimes(1);
    });

    it("sends the duplicate banner's Reload to the presenter", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("duplicate")
        });

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));

        expect(presenter.reloadDuplicate).toHaveBeenCalledTimes(1);
    });

    it("shows an options failure under the header too, after the save banner", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("message"),
            optionsBanner: createOptionsBannerVm()
        });

        const save = screen.getByTestId("message-banner");
        const options = screen.getByTestId("options-banner");
        expect(
            save.compareDocumentPosition(options) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("shows an options failure with no workflow open", () => {
        const presenter = renderLayout({ optionsBanner: createOptionsBannerVm() });

        expect(screen.getByText("Could not load the step options.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("shows the banner above the no-workflow state", () => {
        renderLayout({
            detail: "empty",
            optionsBanner: createOptionsBannerVm(),
            empty: {
                title: "Article has no workflow",
                description:
                    "Add a workflow to require a review before Article content can be published."
            }
        });

        const banner = screen.getByTestId("options-banner");
        const empty = screen.getByText("Article has no workflow");
        expect(
            banner.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("guards leaving with the dirty flag and the name of the open workflow", () => {
        renderLayout({ detail: "workflow", header: HEADER });

        expect(useLeaveGuard).toHaveBeenLastCalledWith(true, "Article review");
    });

    it("does not guard leaving while the draft is clean", () => {
        renderLayout({ detail: "workflow", header: { ...HEADER, dirty: false } });

        expect(useLeaveGuard).toHaveBeenLastCalledWith(false, "Article review");
    });

    it("does not guard leaving without an open workflow", () => {
        renderLayout();

        expect(useLeaveGuard).toHaveBeenLastCalledWith(false, "");
    });
});
