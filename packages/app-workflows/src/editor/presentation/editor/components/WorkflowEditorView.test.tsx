import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import { WorkflowEditorView } from "./WorkflowEditorView.js";

interface StepDrawerStubProps {
    source: unknown;
    stepId: string | null;
}

const drawerProps = vi.hoisted(() => ({ calls: [] as StepDrawerStubProps[] }));

vi.mock("~/editor/presentation/stepDrawer/StepDrawer.js", () => {
    return {
        StepDrawer: (props: StepDrawerStubProps) => {
            drawerProps.calls.push(props);
            return <div data-testid="step-drawer" />;
        }
    };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const Breadcrumb = (props: { name: string; label: string }) => {
        return (
            <li data-testid="breadcrumb" data-name={props.name}>
                {props.label}
            </li>
        );
    };
    return { ...actual, AdminConfig: Object.assign(() => null, { Breadcrumb }) };
});

vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});

const app = {
    appKind: "cms",
    panelLabel: "Content models",
    appliesToLabel: "Headless CMS model",
    init: vi.fn(),
    renderModelIcon: (modelId: string) => <span data-testid={`icon-${modelId}`} />
} as unknown as WorkflowEditorAppAdapter;

const createSetup = (
    status: "loading" | "ready",
    openStepId: string | null = null,
    overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}
) => {
    const fake = createFakeEditorViewPresenter(
        createEditorViewModel({ status, openStepId, ...overrides })
    );
    const init = vi.fn();
    const dispose = vi.fn();
    const presenter = { ...fake, init, dispose };
    const container = new Container();
    container.registerInstance(
        WorkflowEditorPresenter,
        presenter as unknown as WorkflowEditorPresenter.Interface
    );
    container.registerInstance(SortablePresenter, createFakeSortable());
    return { container, init, dispose, presenter };
};

describe("WorkflowEditorView", () => {
    it("initialises the presenter with the per-app props, no editor use cases, and disposes it on unmount (R353)", () => {
        const { container, init, dispose } = createSetup("ready");

        const { unmount } = renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ app });
        expect(dispose).not.toHaveBeenCalled();

        unmount();
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it("renders the layout from the presenter's view model", () => {
        const { container } = createSetup("loading");

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
    });

    it("renders the app's model icons through the adapter", () => {
        const { container } = createSetup("ready");

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(screen.getByTestId("icon-article")).toBeTruthy();
    });

    it("renders the step drawer with the presenter as its source and the open step id", () => {
        const { container, presenter } = createSetup("ready", "step-1");
        drawerProps.calls.length = 0;

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(screen.getByTestId("step-drawer")).toBeTruthy();
        const last = drawerProps.calls[drawerProps.calls.length - 1];
        expect(last.source).toBe(presenter);
        expect(last.stepId).toBe("step-1");
    });

    it("passes a null step id while no step is open", () => {
        const { container } = createSetup("ready", null);
        drawerProps.calls.length = 0;

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        const last = drawerProps.calls[drawerProps.calls.length - 1];
        expect(last.stepId).toBeNull();
    });

    it("ends the breadcrumb with the model name while a model is open", () => {
        const { container } = createSetup("ready", null, {
            detail: "workflow",
            flow: { steps: [], stepsError: null, modelName: "Article" }
        });

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        const crumbs = screen.getAllByTestId("breadcrumb");
        expect(crumbs).toHaveLength(1);
        expect(crumbs[0].textContent).toBe("Article");
        expect(crumbs[0].getAttribute("data-name")).toBe("cms.workflows.model");
    });

    it("keeps the model breadcrumb for a model without a workflow", () => {
        const base = createEditorViewModel();
        const { container } = createSetup("ready", null, {
            detail: "empty",
            panel: { ...base.panel, rows: [{ ...base.panel.rows[0], active: true }] },
            flow: { steps: [], stepsError: null, modelName: "" }
        });

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(screen.getByTestId("breadcrumb").textContent).toBe("Article");
    });

    it("adds no model breadcrumb while no model is open", () => {
        const { container } = createSetup("ready", null, {
            detail: "none",
            flow: { steps: [], stepsError: null, modelName: "" }
        });

        renderWithContainer(
            <WorkflowEditorView app={app} breadcrumbName="cms.workflows" />,
            container
        );

        expect(screen.queryByTestId("breadcrumb")).toBeNull();
    });
});
