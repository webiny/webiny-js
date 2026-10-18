import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { WorkflowEditorView } from "./WorkflowEditorView.js";

const useCases = { name: "editor use cases" } as unknown as IWorkflowEditorUseCases;
const reviewUseCases = { name: "review use cases" } as unknown as IReviewReadUseCases;
const app = {
    appKind: "cms",
    panelLabel: "Content models",
    appliesToLabel: "Headless CMS model",
    init: vi.fn(),
    renderModelIcon: (modelId: string) => <span data-testid={`icon-${modelId}`} />
} as unknown as WorkflowEditorAppAdapter;

const createSetup = (status: "loading" | "ready") => {
    const fake = createFakeEditorViewPresenter(createEditorViewModel({ status }));
    const init = vi.fn();
    const dispose = vi.fn();
    const presenter = { ...fake, init, dispose };
    const container = new Container();
    container.registerInstance(
        WorkflowEditorPresenter,
        presenter as unknown as WorkflowEditorPresenter.Interface
    );
    return { container, init, dispose };
};

describe("WorkflowEditorView", () => {
    it("initialises the presenter with the per-app props and disposes it on unmount", () => {
        const { container, init, dispose } = createSetup("ready");

        const { unmount } = renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ useCases, reviewUseCases, app });
        expect(dispose).not.toHaveBeenCalled();

        unmount();
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it("renders the layout from the presenter's view model", () => {
        const { container } = createSetup("loading");

        renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
    });

    it("renders the app's model icons through the adapter", () => {
        const { container } = createSetup("ready");

        renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(screen.getByTestId("icon-article")).toBeTruthy();
    });
});
