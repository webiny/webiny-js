import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Accordion } from "@webiny/admin-ui";
import { AdminUiProvider } from "@webiny/admin-ui";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
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
    description: null,
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

const renderCard = (props: StepCardProps) => {
    return renderWithAdminUi(
        <Accordion variant="container">
            <StepCard {...props} />
        </Accordion>
    );
};

describe("StepCard", () => {
    it("shows the number, the title, the meta line and the type tag", () => {
        renderCard(createProps());

        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("Legal sign-off")).toBeTruthy();
        expect(screen.getByText("Legal + Editors")).toBeTruthy();
        expect(screen.getByText("People")).toBeTruthy();
    });

    it("puts the type tag in the title row after the title", () => {
        renderCard(createProps());

        const title = screen.getByText("Legal sign-off");
        const row = title.closest('[data-role="step-title-row"]')!;
        const tag = screen.getByText("People");
        expect(row.contains(tag)).toBe(true);
        expect(title.compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("marks the card with its step id", () => {
        renderCard(createProps());

        expect(cardOf("step-2").getAttribute("data-step-id")).toBe("step-2");
    });

    it("shows the Read-only tag only on a read-only step", () => {
        const { unmount } = renderCard(createProps());
        expect(screen.queryByText("Read-only")).toBeNull();
        unmount();

        renderCard(createProps({ step: { ...STEP, readOnly: true } }));
        expect(screen.getByText("Read-only")).toBeTruthy();
    });

    it("shows the warning lines and no error alert by default", () => {
        const warnings: StepWarningLine[] = [
            { text: "Legal has no members.", severity: "warning" },
            { text: "The automation “Send webhook” no longer exists.", severity: "warning" }
        ];
        renderCard(createProps({ step: { ...STEP, warnings } }));

        expect(screen.getByText("Legal has no members.")).toBeTruthy();
        expect(screen.getByText("The automation “Send webhook” no longer exists.")).toBeTruthy();
        const lines = screen.getAllByRole("alert");
        expect(lines).toHaveLength(2);
        expect(lines.every(line => line.getAttribute("data-severity") === "warning")).toBe(true);
    });

    it("shows the error as an alert, open by default", () => {
        renderCard(createProps({ step: { ...STEP, error: "Enter a title for this step." } }));

        const alert = screen.getByRole("alert");
        expect(alert.textContent).toContain("Enter a title for this step.");
    });

    it("marks a live rule error line and a rule warning line by severity", () => {
        const step: StepCardVm = {
            ...STEP,
            warnings: [
                { text: "Rule 1: The assigned user was deleted.", severity: "error" },
                { text: "Rule 2: The folder no longer exists.", severity: "warning" }
            ]
        };
        renderCard(createProps({ step }));

        const error = screen.getByText("Rule 1: The assigned user was deleted.");
        const warning = screen.getByText("Rule 2: The folder no longer exists.");
        expect(error.closest("[data-severity]")?.getAttribute("data-severity")).toBe("error");
        expect(warning.closest("[data-severity]")?.getAttribute("data-severity")).toBe("warning");
    });

    it("shows a rule error and the teams-off line on a read-only step", () => {
        const step: StepCardVm = {
            ...STEP,
            readOnly: true,
            summary: "",
            warnings: [
                {
                    text: "This step needs teams, which are not enabled. It can't be edited.",
                    severity: "warning"
                }
            ],
            error: "Rule 1: The target user is not a member of the step's teams."
        };
        renderCard(createProps({ step }));

        expect(
            screen.getByText("This step needs teams, which are not enabled. It can't be edited.")
        ).toBeTruthy();
        expect(
            screen.getByText("Rule 1: The target user is not a member of the step's teams.")
        ).toBeTruthy();
        expect(screen.getByText("Read-only")).toBeTruthy();
    });

    it("disables Move up on the first card", () => {
        const props = createProps({ index: 0, step: { ...STEP, canMoveUp: false } });
        renderCard(props);

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
        renderCard(props);

        const down = screen.getByRole("button", { name: "Move down" });
        expect(down.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(down);
        expect(props.onMove).not.toHaveBeenCalled();
    });

    it("moves one place up or down", () => {
        const props = createProps({ index: 1 });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Move up" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 0);

        fireEvent.click(screen.getByRole("button", { name: "Move down" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    });

    it("edits through the Edit action", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Edit step" }));

        expect(props.onEdit).toHaveBeenCalledTimes(1);
        expect(props.onEdit).toHaveBeenCalledWith("step-2");
    });

    it("deletes through the Delete action", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Delete step" }));

        expect(props.onDelete).toHaveBeenCalledWith("step-2");
    });

    it("keeps move, edit and delete enabled on a read-only step (QBZ-47)", () => {
        renderCard(createProps({ step: { ...STEP, readOnly: true } }));

        for (const name of ["Move up", "Move down", "Edit step", "Delete step"]) {
            const button = screen.getByRole("button", { name });
            expect(button.getAttribute("aria-disabled")).not.toBe("true");
        }
    });

    it("disables move and delete while a save is in flight (Task 10)", () => {
        const props = createProps({ disabled: true });
        renderCard(props);

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
        renderCard(createProps({ sortable }));

        expect(sortable.ref).toHaveBeenCalledWith(cardOf("step-2"));
        expect(sortable.handleRef).toHaveBeenCalledWith(expect.any(HTMLElement));
        expect(cardOf("step-2").hasAttribute("data-sortable-item")).toBe(true);
    });

    it("renders an unknown type with its server title", () => {
        const step: StepCardVm = {
            ...STEP,
            typeLabel: "Custom check",
            type: "custom",
            readOnly: true
        };
        renderCard(createProps({ step }));

        expect(screen.getByText("Custom check")).toBeTruthy();
    });

    it("shows the People meta line and the rule lines with their numbers", () => {
        const step: StepCardVm = {
            ...STEP,
            summary: "Legal + Editors · Round-robin · 2 routing rules · requester can pick",
            warnings: [
                { text: "Rule 1: Choose who this rule assigns to.", severity: "error" },
                { text: "Rule 2: The folder no longer exists.", severity: "warning" }
            ]
        };
        renderCard(createProps({ step }));

        expect(
            screen.getByText("Legal + Editors · Round-robin · 2 routing rules · requester can pick")
        ).toBeTruthy();
        expect(screen.getByText("Rule 1: Choose who this rule assigns to.")).toBeTruthy();
        expect(screen.getByText("Rule 2: The folder no longer exists.")).toBeTruthy();
    });

    it("opens an item by itself when a problem appears after the first render", () => {
        const view = renderCard(createProps());
        expect(screen.queryByText("Enter a title for this step.")).toBeNull();

        view.rerender(
            <AdminUiProvider>
                <Accordion variant="container">
                    <StepCard
                        {...createProps({
                            step: { ...STEP, error: "Enter a title for this step." }
                        })}
                    />
                </Accordion>
            </AdminUiProvider>
        );

        expect(screen.getByText("Enter a title for this step.")).toBeTruthy();
    });

    describe("keyboard on the actions", () => {
        const withDetails: StepCardVm = { ...STEP, description: "Checks the legal wording." };

        it("runs Delete step on Enter without toggling the item", async () => {
            const props = createProps({ step: withDetails });
            renderCard(props);
            const user = userEvent.setup();

            screen.getByRole("button", { name: "Delete step" }).focus();
            await user.keyboard("{Enter}");

            expect(props.onDelete).toHaveBeenCalledWith("step-2");
            expect(screen.queryByText("Checks the legal wording.")).toBeNull();
        });

        it("runs Move up on Space without toggling the item", async () => {
            const props = createProps({ step: withDetails });
            renderCard(props);
            const user = userEvent.setup();

            screen.getByRole("button", { name: "Move up" }).focus();
            await user.keyboard(" ");

            expect(props.onMove).toHaveBeenCalledWith(1, 0);
            expect(screen.queryByText("Checks the legal wording.")).toBeNull();
        });
    });

    describe("a problem that changes", () => {
        const rerenderCard = (view: ReturnType<typeof renderCard>, step: StepCardVm) => {
            view.rerender(
                <AdminUiProvider>
                    <Accordion variant="container">
                        <StepCard {...createProps({ step })} />
                    </Accordion>
                </AdminUiProvider>
            );
        };

        it("opens a step that had a warning when an error appears", () => {
            const warning: StepWarningLine = { text: "Legal has no members.", severity: "warning" };
            const view = renderCard(createProps({ step: { ...STEP, warnings: [warning] } }));
            // The user collapses the item that opened with its warning.
            fireEvent.click(screen.getByText("Legal sign-off"));
            expect(screen.queryByText("Legal has no members.")).toBeNull();

            rerenderCard(view, { ...STEP, warnings: [warning], error: "Enter a title." });

            expect(screen.getByText("Enter a title.")).toBeTruthy();
        });

        it("opens a step the user collapsed when a new error appears", () => {
            const view = renderCard(createProps({ step: { ...STEP, error: "Enter a title." } }));
            fireEvent.click(screen.getByText("Legal sign-off"));
            expect(screen.queryByText("Enter a title.")).toBeNull();

            rerenderCard(view, { ...STEP, error: "Pick a person." });

            expect(screen.getByText("Pick a person.")).toBeTruthy();
        });

        it("shows an Error tag on a step with an error and a Warning tag on a warning", () => {
            const { unmount } = renderCard(
                createProps({ step: { ...STEP, error: "Enter a title." } })
            );
            expect(screen.getByText("Error")).toBeTruthy();
            expect(screen.queryByText("Warning")).toBeNull();
            unmount();

            renderCard(
                createProps({
                    step: {
                        ...STEP,
                        warnings: [{ text: "Legal has no members.", severity: "warning" }]
                    }
                })
            );
            expect(screen.getByText("Warning")).toBeTruthy();
            expect(screen.queryByText("Error")).toBeNull();
        });
    });

    it("shows the step description when the item is expanded", () => {
        renderCard(createProps({ step: { ...STEP, description: "Checks the legal wording." } }));

        expect(screen.queryByText("Checks the legal wording.")).toBeNull();
        fireEvent.click(screen.getByText("Legal sign-off"));
        expect(screen.getByText("Checks the legal wording.")).toBeTruthy();
    });

    it("gives every step the same open-close indicator, with or without details", () => {
        renderCard(createProps());

        expect(cardOf("step-2").querySelectorAll('[data-role="open-close-indicator"]').length).toBe(
            1
        );
    });

    it("shows the meta line in the body of an item with no description, warnings or error", () => {
        renderCard(createProps());

        fireEvent.click(screen.getByText("Legal sign-off"));

        const details = cardOf("step-2").querySelector('[data-role="step-details"]');
        expect(details?.textContent).toBe("Legal + Editors");
    });

    it("renders the step number in a fixed-width slot", () => {
        renderCard(createProps());

        const slot = cardOf("step-2").querySelector('[data-role="step-number"]');
        expect(slot?.textContent).toBe("2");
    });
});
