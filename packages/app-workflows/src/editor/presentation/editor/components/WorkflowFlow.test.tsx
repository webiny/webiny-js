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
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import type { FakeSortablePresenter } from "~/editor/testing/fakeSortablePresenter.js";
import { WorkflowFlow } from "./WorkflowFlow.js";
import type { WorkflowFlowProps } from "./WorkflowFlow.js";

const createStep = (id: string, number: number, title: string): StepCardVm => {
    return {
        id,
        number,
        title,
        color: "#3B6FD4",
        typeLabel: "People",
        type: "review",
        summary: `${title} summary`,
        readOnly: false,
        warnings: [],
        error: null,
        canMoveUp: number > 1,
        canMoveDown: number < 3
    };
};

const STEPS = [
    createStep("s1", 1, "Editorial check"),
    createStep("s2", 2, "Legal sign-off"),
    createStep("s3", 3, "Brand check")
];

const createProps = (overrides: Partial<WorkflowFlowProps> = {}): WorkflowFlowProps => {
    return {
        flow: { steps: STEPS, stepsError: null },
        scrollRequest: null,
        onAddStep: vi.fn(),
        onEditStep: vi.fn(),
        onMoveStep: vi.fn(),
        onDeleteStep: vi.fn(),
        ...overrides
    };
};

const createContainer = (sortable: FakeSortablePresenter): Container => {
    const container = new Container();
    container.registerInstance(SortablePresenter, sortable);
    return container;
};

const renderFlow = (props: WorkflowFlowProps, sortable: FakeSortablePresenter) => {
    return renderWithContainer(<WorkflowFlow {...props} />, createContainer(sortable));
};

describe("WorkflowFlow", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("shows the Draft and Published cards around the steps", () => {
        renderFlow(createProps(), createFakeSortable());

        expect(screen.getByText("Draft")).toBeTruthy();
        expect(screen.getByText("The author saves a revision and requests a review.")).toBeTruthy();
        expect(screen.getByText("Published")).toBeTruthy();
        expect(screen.getByText("Publishing is allowed once every step approves.")).toBeTruthy();
    });

    it("renders the step cards in order", () => {
        renderFlow(createProps(), createFakeSortable());

        const summaries = screen.getAllByTestId(/^step-card-/).map(card => {
            return within(card).getByText(/summary$/).textContent;
        });
        expect(summaries).toEqual([
            "Editorial check summary",
            "Legal sign-off summary",
            "Brand check summary"
        ]);
    });

    it("has a + before every card and after the last", () => {
        const props = createProps();
        renderFlow(props, createFakeSortable());

        const connectors = screen.getAllByRole("button", { name: "Add step" });
        expect(connectors).toHaveLength(4);

        fireEvent.click(connectors[0]);
        fireEvent.click(connectors[2]);
        fireEvent.click(connectors[3]);

        expect(props.onAddStep).toHaveBeenNthCalledWith(1, 0);
        expect(props.onAddStep).toHaveBeenNthCalledWith(2, 2);
        expect(props.onAddStep).toHaveBeenNthCalledWith(3, 3);
    });

    it("shows the No steps yet box with one Add step button and no + connectors", () => {
        const props = createProps({ flow: { steps: [], stepsError: null } });
        renderFlow(props, createFakeSortable());

        expect(screen.getByText("No steps yet")).toBeTruthy();
        const add = screen.getAllByRole("button", { name: "Add step" });
        expect(add).toHaveLength(1);

        fireEvent.click(add[0]);
        expect(props.onAddStep).toHaveBeenCalledWith(0);
        expect(screen.getByText("Draft")).toBeTruthy();
        expect(screen.getByText("Published")).toBeTruthy();
    });

    it("marks the No steps yet box with the steps error", () => {
        const props = createProps({
            flow: { steps: [], stepsError: "Add at least one step." }
        });
        renderFlow(props, createFakeSortable());

        expect(screen.getByText("Add at least one step.")).toBeTruthy();
        expect(screen.getByTestId("no-steps").className).toContain("border-destructive-default");
    });

    it("does not show the steps error while there are steps", () => {
        const props = createProps({
            flow: { steps: STEPS, stepsError: "Add at least one step." }
        });
        renderFlow(props, createFakeSortable());

        expect(screen.queryByText("Add at least one step.")).toBeNull();
    });

    it("passes edit, move and delete with the card's step id and indexes", () => {
        const props = createProps();
        renderFlow(props, createFakeSortable());

        const card = screen.getByTestId("step-card-s2");
        fireEvent.click(within(card).getByRole("button", { name: "Edit step" }));
        fireEvent.click(within(card).getByRole("button", { name: "Move down" }));
        fireEvent.click(within(card).getByRole("button", { name: "Delete step" }));

        expect(props.onEditStep).toHaveBeenCalledWith("s2");
        expect(props.onMoveStep).toHaveBeenCalledWith(1, 2);
        expect(props.onDeleteStep).toHaveBeenCalledWith("s2");
    });

    it("initialises the sortable with the steps type and asks it for every card", () => {
        const sortable = createFakeSortable();
        renderFlow(createProps(), sortable);

        expect(sortable.init).toHaveBeenCalledTimes(1);
        expect(sortable.config().type).toBe("workflow-steps");
        expect(sortable.getItemProps).toHaveBeenCalledWith(0);
        expect(sortable.getItemProps).toHaveBeenCalledWith(1);
        expect(sortable.getItemProps).toHaveBeenCalledWith(2);
    });

    it("moves a step when the sortable reports a reorder", () => {
        const props = createProps();
        const sortable = createFakeSortable();
        renderFlow(props, sortable);

        sortable.config().onReorder(0, 2);

        expect(props.onMoveStep).toHaveBeenCalledWith(0, 2);
    });

    it("reports a reorder to the latest callback after a re-render", () => {
        const first = createProps();
        const second = createProps();
        const sortable = createFakeSortable();
        const container = createContainer(sortable);
        const { rerender } = renderWithContainer(<WorkflowFlow {...first} />, container);

        rerender(
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <WorkflowFlow {...second} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
        sortable.config().onReorder(2, 0);

        expect(first.onMoveStep).not.toHaveBeenCalled();
        expect(second.onMoveStep).toHaveBeenCalledWith(2, 0);
    });

    it("ignores a drag reorder and disables add, move and delete while disabled (Task 10)", () => {
        const props = createProps({ disabled: true });
        const sortable = createFakeSortable();
        renderFlow(props, sortable);

        sortable.config().onReorder(0, 2);
        expect(props.onMoveStep).not.toHaveBeenCalled();

        const connectors = screen.getAllByRole("button", { name: "Add step" });
        for (const connector of connectors) {
            expect(connector.getAttribute("aria-disabled")).toBe("true");
            fireEvent.click(connector);
        }
        expect(props.onAddStep).not.toHaveBeenCalled();

        const card = screen.getByTestId("step-card-s2");
        fireEvent.click(within(card).getByRole("button", { name: "Move down" }));
        fireEvent.click(within(card).getByRole("button", { name: "Delete step" }));
        expect(props.onMoveStep).not.toHaveBeenCalled();
        expect(props.onDeleteStep).not.toHaveBeenCalled();
    });

    it("disables the empty-flow Add step button while disabled", () => {
        const props = createProps({ flow: { steps: [], stepsError: null }, disabled: true });
        renderFlow(props, createFakeSortable());

        fireEvent.click(screen.getByRole("button", { name: "Add step" }));

        expect(props.onAddStep).not.toHaveBeenCalled();
    });

    it("dims the card the sortable reports as dragged", () => {
        renderFlow(createProps(), createFakeSortable({ 1: { isDragging: true } }));

        expect(screen.getByTestId("step-card-s2").style.opacity).toBe("0.5");
        expect(screen.getByTestId("step-card-s1").style.opacity).toBe("1");
    });

    it("disposes the sortable on unmount", () => {
        const sortable = createFakeSortable();
        const { unmount } = renderFlow(createProps(), sortable);

        expect(sortable.dispose).not.toHaveBeenCalled();
        unmount();
        expect(sortable.dispose).toHaveBeenCalledTimes(1);
    });

    it("scrolls the requested card into view", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        renderFlow(
            createProps({ scrollRequest: { stepId: "s2", nonce: 1 } }),
            createFakeSortable()
        );

        expect(scroll).toHaveBeenCalledTimes(1);
        expect(scroll.mock.contexts[0]).toBe(screen.getByTestId("step-card-s2"));
        expect(scroll).toHaveBeenCalledWith({ block: "center", behavior: "smooth" });
    });

    it("scrolls again only for a new request", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        const sortable = createFakeSortable();
        const first = createProps({ scrollRequest: { stepId: "s2", nonce: 1 } });
        const container = createContainer(sortable);
        const { rerender } = renderWithContainer(<WorkflowFlow {...first} />, container);
        expect(scroll).toHaveBeenCalledTimes(1);

        const same = createProps({ scrollRequest: { stepId: "s2", nonce: 1 } });
        rerender(
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <WorkflowFlow {...same} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
        expect(scroll).toHaveBeenCalledTimes(1);

        const next = createProps({ scrollRequest: { stepId: "s3", nonce: 2 } });
        rerender(
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <WorkflowFlow {...next} />
                </DiContainerProvider>
            </AdminUiProvider>
        );
        expect(scroll).toHaveBeenCalledTimes(2);
        expect(scroll.mock.contexts[1]).toBe(screen.getByTestId("step-card-s3"));
    });

    it("does not scroll without a request or for an unknown step", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        const { unmount } = renderFlow(createProps(), createFakeSortable());
        unmount();
        renderFlow(
            createProps({ scrollRequest: { stepId: "missing", nonce: 1 } }),
            createFakeSortable()
        );

        expect(scroll).not.toHaveBeenCalled();
    });
});
