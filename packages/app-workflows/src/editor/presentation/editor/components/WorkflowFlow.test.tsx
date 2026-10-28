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
        flow: { steps: STEPS, stepsError: null, modelName: "Article" },
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

    it("has no Draft or Published end cards and no connectors", () => {
        renderFlow(createProps(), createFakeSortable());

        expect(screen.queryByText("Draft")).toBeNull();
        expect(screen.queryByText("Published")).toBeNull();
        expect(document.querySelectorAll('[data-role="connector-line"]')).toHaveLength(0);
        expect(document.querySelectorAll('[data-role="connector"]')).toHaveLength(0);
    });

    it("renders one item per step in order, with its title, type tag and meta line", () => {
        renderFlow(createProps(), createFakeSortable());

        const cards = screen.getAllByTestId(/^step-card-/);
        expect(cards.map(card => card.getAttribute("data-step-id"))).toEqual(["s1", "s2", "s3"]);
        const titles = ["Editorial check", "Legal sign-off", "Brand check"];
        cards.forEach((card, index) => {
            expect(within(card).getByText(titles[index])).toBeTruthy();
            expect(within(card).getByText("People")).toBeTruthy();
            expect(within(card).getByText(`${titles[index]} summary`)).toBeTruthy();
        });
    });

    it("has one Add step button after the last item that appends a step", () => {
        const props = createProps();
        renderFlow(props, createFakeSortable());

        const add = screen.getAllByRole("button", { name: "Add step" });
        expect(add).toHaveLength(1);
        const cards = screen.getAllByTestId(/^step-card-/);
        const last = cards[cards.length - 1];
        expect(
            last.compareDocumentPosition(add[0]) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(add[0].querySelector("svg")).not.toBeNull();

        fireEvent.click(add[0]);
        expect(props.onAddStep).toHaveBeenCalledWith(3);
    });

    it("shows the empty state with the model name and one Add step action", () => {
        const props = createProps({ flow: { steps: [], stepsError: null, modelName: "Article" } });
        renderFlow(props, createFakeSortable());

        expect(screen.getByTestId("no-steps")).toBeTruthy();
        expect(screen.getByText("No steps yet")).toBeTruthy();
        expect(
            screen.getByText(
                "Add the first step: who or what reviews Article content before it can be published."
            )
        ).toBeTruthy();
        const add = screen.getAllByRole("button", { name: "Add step" });
        expect(add).toHaveLength(1);
        expect(screen.getByTestId("no-steps").contains(add[0])).toBe(true);

        fireEvent.click(add[0]);
        expect(props.onAddStep).toHaveBeenCalledWith(0);
    });

    it("shows the steps error in the empty state", () => {
        const props = createProps({
            flow: { steps: [], stepsError: "Add at least one step.", modelName: "Article" }
        });
        renderFlow(props, createFakeSortable());

        expect(screen.getByRole("alert").textContent).toContain("Add at least one step.");
    });

    it("does not show the steps error while there are steps", () => {
        const props = createProps({
            flow: { steps: STEPS, stepsError: "Add at least one step.", modelName: "Article" }
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

        const add = screen.getByRole("button", { name: "Add step" });
        expect(add.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(add);
        expect(props.onAddStep).not.toHaveBeenCalled();

        const card = screen.getByTestId("step-card-s2");
        fireEvent.click(within(card).getByRole("button", { name: "Move down" }));
        fireEvent.click(within(card).getByRole("button", { name: "Delete step" }));
        expect(props.onMoveStep).not.toHaveBeenCalled();
        expect(props.onDeleteStep).not.toHaveBeenCalled();
    });

    it("disables the empty-flow Add step button while disabled", () => {
        const props = createProps({
            flow: { steps: [], stepsError: null, modelName: "Article" },
            disabled: true
        });
        renderFlow(props, createFakeSortable());

        fireEvent.click(screen.getByRole("button", { name: "Add step" }));

        expect(props.onAddStep).not.toHaveBeenCalled();
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

    it("does not scroll again when the flow is remounted with a request it already handled", () => {
        const scroll = vi.spyOn(Element.prototype, "scrollIntoView");
        const request = { stepId: "s2", nonce: 1 };
        const first = renderFlow(createProps({ scrollRequest: request }), createFakeSortable());
        expect(scroll).toHaveBeenCalledTimes(1);
        first.unmount();

        renderFlow(createProps({ scrollRequest: request }), createFakeSortable());

        expect(scroll).toHaveBeenCalledTimes(1);
    });

    const renderMovable = (container: Container, steps: StepCardVm[], props: WorkflowFlowProps) => {
        return renderWithContainer(
            <WorkflowFlow {...props} flow={{ steps, stepsError: null, modelName: "Article" }} />,
            container
        );
    };

    const rerenderMovable = (
        container: Container,
        steps: StepCardVm[],
        props: WorkflowFlowProps
    ) => {
        return (
            <AdminUiProvider>
                <DiContainerProvider container={container}>
                    <WorkflowFlow
                        {...props}
                        flow={{ steps, stepsError: null, modelName: "Article" }}
                    />
                </DiContainerProvider>
            </AdminUiProvider>
        );
    };

    it("keeps focus on the moved card's Move down button after a keyboard move", () => {
        const container = createContainer(createFakeSortable());
        const props = createProps();
        const view = renderMovable(container, STEPS, props);

        const button = within(screen.getByTestId("step-card-s1")).getByRole("button", {
            name: "Move down"
        });
        button.focus();
        fireEvent.click(button);
        expect(props.onMoveStep).toHaveBeenCalledWith(0, 1);

        const moved = [
            { ...STEPS[1], number: 1, canMoveUp: false, canMoveDown: true },
            { ...STEPS[0], number: 2, canMoveUp: true, canMoveDown: true },
            STEPS[2]
        ];
        view.rerender(rerenderMovable(container, moved, props));

        const expected = within(screen.getByTestId("step-card-s1")).getByRole("button", {
            name: "Move down"
        });
        expect(document.activeElement).toBe(expected);
    });

    it("focuses the other Move button when the card reached the end", () => {
        const container = createContainer(createFakeSortable());
        const props = createProps();
        const view = renderMovable(container, STEPS, props);

        const button = within(screen.getByTestId("step-card-s2")).getByRole("button", {
            name: "Move down"
        });
        fireEvent.click(button);

        const moved = [STEPS[0], { ...STEPS[2], number: 2 }, { ...STEPS[1], number: 3 }].map(
            (step, index) => ({ ...step, canMoveUp: index > 0, canMoveDown: index < 2 })
        );
        view.rerender(rerenderMovable(container, moved, props));

        const expected = within(screen.getByTestId("step-card-s2")).getByRole("button", {
            name: "Move up"
        });
        expect(document.activeElement).toBe(expected);
    });

    it("announces the new position after a move in a polite live region", () => {
        const container = createContainer(createFakeSortable());
        const props = createProps();
        const view = renderMovable(container, STEPS, props);

        const region = screen.getByRole("status");
        expect(region.getAttribute("aria-live")).toBe("polite");
        expect(region.textContent).toBe("");

        fireEvent.click(
            within(screen.getByTestId("step-card-s1")).getByRole("button", { name: "Move down" })
        );
        const moved = [STEPS[1], STEPS[0], STEPS[2]];
        view.rerender(rerenderMovable(container, moved, props));

        expect(screen.getByRole("status").textContent).toBe("Step moved to position 2 of 3.");
    });
});
