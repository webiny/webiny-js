import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
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
    details: [
        { label: "Reviewing teams", value: "Legal, Editors" },
        { label: "Assignment", value: "Team pool" }
    ],
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
        total: 3,
        sortable: createItemProps(),
        onEdit: vi.fn(),
        onAddAfter: vi.fn(),
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
    it("shows the number, the title and the type tag, without the meta line", () => {
        renderCard(createProps());

        expect(screen.getByText("2")).toBeTruthy();
        expect(screen.getByText("Legal sign-off")).toBeTruthy();
        expect(screen.queryByText("Legal + Editors")).toBeNull();
        expect(screen.getByText("People")).toBeTruthy();
    });

    it("puts the number tag in the title row before the title", () => {
        renderCard(createProps());

        const title = screen.getByText("Legal sign-off");
        const row = title.closest('[data-role="step-title-row"]')!;
        const number = row.querySelector('[data-role="step-number"]') as HTMLElement;
        expect(number.textContent).toBe("2");
        expect(
            number.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("groups move up, move down and delete under the step's name, without an edit action", () => {
        renderCard(createProps());

        const group = screen.getByRole("group", { name: "Actions for Legal sign-off" });
        const names = within(group)
            .getAllByRole("button")
            .map(button => button.getAttribute("aria-label"));
        expect(names).toEqual([
            "Move Legal sign-off up",
            "Move Legal sign-off down",
            "Delete Legal sign-off"
        ]);
        expect(screen.queryByRole("button", { name: "Edit step" })).toBeNull();
    });

    it("puts the type tag in the title row after the title", () => {
        renderCard(createProps());

        const title = screen.getByText("Legal sign-off");
        const row = title.closest('[data-role="step-title-row"]')!;
        const tag = screen.getByText("People");
        expect(row.contains(tag)).toBe(true);
        expect(title.compareDocumentPosition(tag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("keeps the add after button outside the accordion item, beside it", () => {
        renderCard(createProps());

        const add = screen.getByRole("button", { name: "Add a step after Legal sign-off" });
        const wrapper = add.closest('[data-role="add-after"]') as HTMLElement;
        const row = screen.getByText("Legal sign-off").closest('[data-role="step-title-row"]')!;
        expect(wrapper.parentElement).toBe(cardOf("step-2"));
        expect(wrapper.contains(row)).toBe(false);
    });

    it("keeps the drag handle outside the accordion item, before it", () => {
        renderCard(createProps());

        const drag = screen.getByRole("button", {
            name: "Drag to reorder Legal sign-off (step 2 of 3)"
        });
        const wrapper = drag.closest('[data-role="drag-handle"]') as HTMLElement;
        const row = screen.getByText("Legal sign-off").closest('[data-role="step-title-row"]')!;
        expect(wrapper.parentElement).toBe(cardOf("step-2"));
        expect(wrapper.contains(row)).toBe(false);
        expect(
            wrapper.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
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

        const up = screen.getByRole("button", { name: "Move Legal sign-off up" });
        expect(up.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(up);
        expect(props.onMove).not.toHaveBeenCalled();
        expect(
            screen
                .getByRole("button", { name: "Move Legal sign-off down" })
                .getAttribute("aria-disabled")
        ).toBe("false");
    });

    it("disables Move down on the last card", () => {
        const props = createProps({ index: 2, step: { ...STEP, canMoveDown: false } });
        renderCard(props);

        const down = screen.getByRole("button", { name: "Move Legal sign-off down" });
        expect(down.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(down);
        expect(props.onMove).not.toHaveBeenCalled();
    });

    it("moves one place up or down", () => {
        const props = createProps({ index: 1 });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Move Legal sign-off up" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 0);

        fireEvent.click(screen.getByRole("button", { name: "Move Legal sign-off down" }));
        expect(props.onMove).toHaveBeenLastCalledWith(1, 2);
    });

    it("edits through the Edit step button in the body", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByText("Legal sign-off"));
        fireEvent.click(screen.getByRole("button", { name: "Edit step" }));

        expect(props.onEdit).toHaveBeenCalledTimes(1);
        expect(props.onEdit).toHaveBeenCalledWith("step-2");
    });

    it("adds a step after this one through the plus action", () => {
        const props = createProps({ index: 1 });
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Add a step after Legal sign-off" }));

        expect(props.onAddAfter).toHaveBeenCalledWith(1);
    });

    it("deletes through the Delete action", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByRole("button", { name: "Delete Legal sign-off" }));

        expect(props.onDelete).toHaveBeenCalledWith("step-2");
    });

    it("keeps move, edit and delete enabled on a read-only step (QBZ-47)", () => {
        renderCard(createProps({ step: { ...STEP, readOnly: true } }));
        fireEvent.click(screen.getByText("Legal sign-off"));

        for (const name of [
            "Move Legal sign-off up",
            "Move Legal sign-off down",
            "Edit step",
            "Delete Legal sign-off"
        ]) {
            const button = screen.getByRole("button", { name });
            expect(button.getAttribute("aria-disabled")).not.toBe("true");
        }
    });

    it("disables move and delete while a save is in flight (Task 10)", () => {
        const props = createProps({ disabled: true });
        renderCard(props);

        for (const name of [
            "Move Legal sign-off up",
            "Move Legal sign-off down",
            "Delete Legal sign-off",
            "Add a step after Legal sign-off"
        ]) {
            const button = screen.getByRole("button", { name });
            expect(button.getAttribute("aria-disabled")).toBe("true");
            fireEvent.click(button);
        }
        expect(props.onAddAfter).not.toHaveBeenCalled();
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

    it("renders the drag handle button inside the element that is the drag source", () => {
        const sortable = createItemProps();
        renderCard(createProps({ sortable }));

        const handle = vi.mocked(sortable.handleRef).mock.calls[0][0] as HTMLElement;
        expect(
            within(handle).getByRole("button", {
                name: "Drag to reorder Legal sign-off (step 2 of 3)"
            })
        ).toBeTruthy();
        expect(cardOf("step-2").contains(handle)).toBe(true);
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

    it("shows the rule lines with their numbers, without the People meta line", () => {
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
            screen.queryByText(
                "Legal + Editors · Round-robin · 2 routing rules · requester can pick"
            )
        ).toBeNull();
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

        it("runs Delete on Enter without toggling the item", async () => {
            const props = createProps({ step: withDetails });
            renderCard(props);
            const user = userEvent.setup();

            screen.getByRole("button", { name: "Delete Legal sign-off" }).focus();
            await user.keyboard("{Enter}");

            expect(props.onDelete).toHaveBeenCalledWith("step-2");
            expect(screen.queryByText("Checks the legal wording.")).toBeNull();
        });

        it("runs Move up on Space without toggling the item", async () => {
            const props = createProps({ step: withDetails });
            renderCard(props);
            const user = userEvent.setup();

            screen.getByRole("button", { name: "Move Legal sign-off up" }).focus();
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

        it("shows an Error tag on a step with an error and a warning count tag on warnings", () => {
            const { unmount } = renderCard(
                createProps({ step: { ...STEP, error: "Enter a title." } })
            );
            expect(screen.getByText("Error")).toBeTruthy();
            expect(screen.queryByText(/\d+ warnings?$/)).toBeNull();
            unmount();

            const second = renderCard(
                createProps({
                    step: {
                        ...STEP,
                        warnings: [{ text: "Legal has no members.", severity: "warning" }]
                    }
                })
            );
            expect(screen.getByText("1 warning")).toBeTruthy();
            expect(screen.queryByText("Error")).toBeNull();
            second.unmount();

            renderCard(
                createProps({
                    step: {
                        ...STEP,
                        warnings: [
                            { text: "Legal has no members.", severity: "warning" },
                            { text: "Marko is away.", severity: "warning" }
                        ]
                    }
                })
            );
            expect(screen.getByText("2 warnings")).toBeTruthy();
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

    it("shows the key and value rows, then an Edit step button, in the expanded body", () => {
        const props = createProps();
        renderCard(props);

        fireEvent.click(screen.getByText("Legal sign-off"));

        const details = cardOf("step-2").querySelector('[data-role="step-details"]') as HTMLElement;
        const rows = Array.from(details.querySelectorAll('[data-role="step-detail-row"]'));
        expect(rows.map(row => row.textContent)).toEqual([
            "Reviewing teamsLegal, Editors",
            "AssignmentTeam pool"
        ]);
        const button = within(details).getByRole("button", { name: "Edit step" });
        expect(
            rows[1].compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();

        fireEvent.click(button);
        expect(props.onEdit).toHaveBeenCalledWith("step-2");
    });

    it("puts the warning and error alerts between the rows and the Edit step button", () => {
        const step: StepCardVm = { ...STEP, error: "Enter a title." };
        renderCard(createProps({ step }));

        const details = cardOf("step-2").querySelector('[data-role="step-details"]') as HTMLElement;
        const row = details.querySelector('[data-role="step-detail-row"]') as HTMLElement;
        const alert = within(details).getByRole("alert");
        const button = within(details).getByRole("button", { name: "Edit step" });
        expect(row.compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(
            alert.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
    });

    it("shows only the Edit step button for a step without rows", () => {
        renderCard(createProps({ step: { ...STEP, details: [] } }));

        fireEvent.click(screen.getByText("Legal sign-off"));

        const details = cardOf("step-2").querySelector('[data-role="step-details"]') as HTMLElement;
        expect(details.querySelectorAll('[data-role="step-detail-row"]')).toHaveLength(0);
        expect(within(details).getByRole("button", { name: "Edit step" })).toBeTruthy();
    });

    it("renders the step number in its own slot", () => {
        renderCard(createProps());

        const slot = cardOf("step-2").querySelector('[data-role="step-number"]');
        expect(slot?.textContent).toBe("2");
    });

    it("shows no drop indicator and no dimming when nothing is dragged", () => {
        renderCard(createProps());

        const card = cardOf(STEP.id);
        expect(card.querySelector('[data-role="drop-indicator"]')).toBeNull();
        expect(card.getAttribute("data-dragging")).toBeNull();
    });

    it("shows the drop indicator on the edge where the dragged step lands", () => {
        renderCard(
            createProps({ sortable: createItemProps({ isOver: true, closestEdge: "top" }) })
        );

        const indicators = cardOf(STEP.id).querySelectorAll('[data-role="drop-indicator"]');
        expect(indicators.length).toBe(1);
        expect(indicators[0].getAttribute("data-edge")).toBe("top");
    });

    it("shows the drop indicator on the bottom edge", () => {
        renderCard(
            createProps({ sortable: createItemProps({ isOver: true, closestEdge: "bottom" }) })
        );

        const indicator = cardOf(STEP.id).querySelector('[data-role="drop-indicator"]')!;
        expect(indicator.getAttribute("data-edge")).toBe("bottom");
    });

    it("marks the dragged step", () => {
        renderCard(createProps({ sortable: createItemProps({ isDragging: true }) }));

        expect(cardOf(STEP.id).getAttribute("data-dragging")).toBe("true");
    });
});
