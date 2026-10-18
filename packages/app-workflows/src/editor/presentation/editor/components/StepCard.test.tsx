import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { StepCard } from "./StepCard.js";
import type { StepCardProps } from "./StepCard.js";

const STEP: StepCardVm = {
    id: "step-2",
    number: 2,
    title: "Legal sign-off",
    color: "#3B6FD4",
    typeLabel: "People",
    type: "review",
    summary: "Legal + Editors",
    readOnly: false,
    warnings: [],
    error: null,
    canMoveUp: true,
    canMoveDown: true
};

const createItemProps = (
    overrides: Partial<SortablePresenter.ItemProps> = {}
): SortablePresenter.ItemProps => {
    return {
        ref: vi.fn(),
        handleRef: vi.fn(),
        isDragging: false,
        isOver: false,
        closestEdge: null,
        ...overrides
    };
};

const createProps = (overrides: Partial<StepCardProps> = {}): StepCardProps => {
    return {
        step: STEP,
        index: 1,
        sortable: createItemProps(),
        onEdit: vi.fn(),
        onMove: vi.fn(),
        onDelete: vi.fn(),
        ...overrides
    };
};

const cardOf = (id: string): HTMLElement => {
    return screen.getByTestId(`step-card-${id}`);
};

describe("StepCard", () => {
    it("shows the number, the title, the summary and the type tag", () => {
        renderWithAdminUi(<StepCard {...createProps()} />);

        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("Legal sign-off")).toBeTruthy();
        expect(screen.getByText("Legal + Editors")).toBeTruthy();
        expect(screen.getByText("People")).toBeTruthy();
    });

    it("marks the card with its step id", () => {
        renderWithAdminUi(<StepCard {...createProps()} />);

        expect(cardOf("step-2").getAttribute("data-step-id")).toBe("step-2");
    });

    it("paints the number circle with the step colour", () => {
        renderWithAdminUi(<StepCard {...createProps()} />);

        const circle = screen.getByText("2");
        expect(circle.style.backgroundColor).toBe("rgb(59, 111, 212)");
    });

    it("shows the Read-only tag only on a read-only step", () => {
        const { unmount } = renderWithAdminUi(<StepCard {...createProps()} />);
        expect(screen.queryByText("Read-only")).toBeNull();
        unmount();

        renderWithAdminUi(<StepCard {...createProps({ step: { ...STEP, readOnly: true } })} />);
        expect(screen.getByText("Read-only")).toBeTruthy();
    });

    it("lists the warning lines and no error strip by default", () => {
        const warnings = [
            "Legal has no members.",
            "The automation “Send webhook” no longer exists."
        ];
        renderWithAdminUi(<StepCard {...createProps({ step: { ...STEP, warnings } })} />);

        expect(screen.getByText("Legal has no members.")).toBeTruthy();
        expect(screen.getByText("The automation “Send webhook” no longer exists.")).toBeTruthy();
        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("shows the error strip and a red border", () => {
        const step = { ...STEP, error: "Enter a title for this step." };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        expect(screen.getByRole("alert").textContent).toBe("Enter a title for this step.");
        expect(cardOf("step-2").className).toContain("border-destructive-default");
    });

    it("has a neutral border without an error", () => {
        renderWithAdminUi(<StepCard {...createProps()} />);

        expect(cardOf("step-2").className).not.toContain("border-destructive-default");
    });

    it("disables Move up on the first card", () => {
        const props = createProps({ index: 0, step: { ...STEP, canMoveUp: false } });
        renderWithAdminUi(<StepCard {...props} />);

        const up = screen.getByRole("button", { name: "Move up" });
        expect(up.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(up);
        expect(props.onMove).not.toHaveBeenCalled();
        expect(
            screen.getByRole("button", { name: "Move down" }).getAttribute("aria-disabled")
        ).toBe("false");
    });

    it("disables Move down on the last card", () => {
        const props = createProps({ index: 2, step: { ...STEP, canMoveDown: false } });
        renderWithAdminUi(<StepCard {...props} />);

        const down = screen.getByRole("button", { name: "Move down" });
        expect(down.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(down);
        expect(props.onMove).not.toHaveBeenCalled();
    });

    it("moves one place up or down", () => {
        const props = createProps({ index: 1 });
        renderWithAdminUi(<StepCard {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Move up" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 0);

        fireEvent.click(screen.getByRole("button", { name: "Move down" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    });

    it("edits through the Edit button and through the title", () => {
        const props = createProps();
        renderWithAdminUi(<StepCard {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Edit step" }));
        fireEvent.click(screen.getByText("Legal sign-off"));

        expect(props.onEdit).toHaveBeenCalledTimes(2);
        expect(props.onEdit).toHaveBeenNthCalledWith(1, "step-2");
        expect(props.onEdit).toHaveBeenNthCalledWith(2, "step-2");
    });

    it("deletes through the Delete button", () => {
        const props = createProps();
        renderWithAdminUi(<StepCard {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete step" }));

        expect(props.onDelete).toHaveBeenCalledWith("step-2");
    });

    it("keeps move, edit and delete enabled on a read-only step (QBZ-47)", () => {
        const step = { ...STEP, readOnly: true };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        for (const name of ["Move up", "Move down", "Edit step", "Delete step"]) {
            const button = screen.getByRole("button", { name });
            expect(button.getAttribute("aria-disabled")).not.toBe("true");
        }
    });

    it("disables move and delete while a save is in flight (Task 10)", () => {
        const props = createProps({ disabled: true });
        renderWithAdminUi(<StepCard {...props} />);

        for (const name of ["Move up", "Move down", "Delete step"]) {
            const button = screen.getByRole("button", { name });
            expect(button.getAttribute("aria-disabled")).toBe("true");
            fireEvent.click(button);
        }
        expect(props.onMove).not.toHaveBeenCalled();
        expect(props.onDelete).not.toHaveBeenCalled();
    });

    it("attaches the drop target and the drag handle", () => {
        const sortable = createItemProps();
        renderWithAdminUi(<StepCard {...createProps({ sortable })} />);

        expect(sortable.ref).toHaveBeenCalledWith(cardOf("step-2"));
        expect(sortable.handleRef).toHaveBeenCalledWith(expect.any(HTMLElement));
        expect(cardOf("step-2").hasAttribute("data-sortable-item")).toBe(true);
    });

    it("dims the dragged card to 50%", () => {
        renderWithAdminUi(
            <StepCard {...createProps({ sortable: createItemProps({ isDragging: true }) })} />
        );

        expect(cardOf("step-2").style.opacity).toBe("0.5");
    });

    it("keeps a card that is not dragged fully opaque", () => {
        renderWithAdminUi(<StepCard {...createProps()} />);

        expect(cardOf("step-2").style.opacity).toBe("1");
    });

    it("marks the drop target with the orange border", () => {
        renderWithAdminUi(
            <StepCard {...createProps({ sortable: createItemProps({ isOver: true }) })} />
        );

        const className = cardOf("step-2").className;
        expect(className).toContain("border-accent-default");
        expect(className).not.toContain("border-neutral-muted");
    });

    it("renders an unknown type with its server title", () => {
        const step: StepCardVm = {
            ...STEP,
            typeLabel: "Custom check",
            type: "custom",
            readOnly: true
        };
        renderWithAdminUi(<StepCard {...createProps({ step })} />);

        expect(screen.getByText("Custom check")).toBeTruthy();
    });
});
