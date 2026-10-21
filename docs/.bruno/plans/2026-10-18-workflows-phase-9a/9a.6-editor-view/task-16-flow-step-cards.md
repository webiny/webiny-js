### Task 16: Flow and step cards

R234, R269 (UI names of the step types), R270 (read-only unknown types), R275 (AI cards stay movable and deletable without the licence, QBZ-47), R276 (the first failing card scrolls into view); D91, D92, D98; QBZ-11, QBZ-47; design README 3 (flow column, step card, drag states), UI-11; `research2-admin.md` 1 (drag and drop), `research-spec.md` 4.1; Review Focus 1 (an own-card move never loses a step) and 2 (a card shows its server or client error and scrolls into view). The vertical flow: the dashed `Draft` card, numbered step cards, a `+` before every card and after the last, the dashed `Published` card, and the `No steps yet` box with `Add step` for an empty workflow. Each step card shows number, title, type tag, summary, warning lines and an error strip, and has up, down, edit and delete buttons and a drag handle driven by the admin `SortablePresenter` (`type: "workflow-steps"`). The card is a view of a render-ready `StepCardVm` (Task 9: title, colour, summary and warnings come from the presenter, R234). The flow also scrolls the card named by `vm.scrollRequest` into view.

- **Flow (README 3):**
  - `Draft` card: dashed, `edit_note` icon, `Draft` / `The author saves a revision and requests a review.`
  - Between and around cards, a connector with a 24px round `+` button (`aria-label` `Add step`). The connector before step `i` calls `onAddStep(i)`; the one after the last step calls `onAddStep(steps.length)`.
  - `Published` card: dashed, `public` icon in success colour, `Published` / `Publishing is allowed once every step approves.`
  - No steps: `Draft`, a dashed `No steps yet` box with a secondary `Add step` button (`onAddStep(0)`), `Published`; no `+` connectors. `flow.stepsError` (`Add at least one step.`, a server `steps` error) shows in the box with a red border.
  - Scroll (R276, Q41): when `scrollRequest` changes (its `nonce`), the card with `scrollRequest.stepId` scrolls into view (`scrollIntoView({ block: "center", behavior: "smooth" })`); the same `nonce` rendered again does nothing, an unknown step id does nothing.
- **Step card (README 3):**
  - A 28px circle in the step colour (`color`, a `var(--color-...)` preset or `#RRGGBB`, with the neutral fallback already applied) with the number; the title (15px, 600; `Untitled step` when empty, resolved by the presenter); an outlined type tag with the type's icon (`group` for `review`, `bolt` for `automation`, `auto_awesome` for `ai`, none for an unknown type; derived from the step's `type` id) and `typeLabel`; a `Read-only` tag when `readOnly`; the summary line.
  - Warning lines (amber, `warning` icon), one per entry of `warnings`. A destructive strip (`role="alert"`) with `error` and a red border when `error` is set (QBZ-11, QBZ-12: client messages and an unmatched server field's text, R276; `Rule n:` strips arrive with 9b).
  - Buttons, `aria-label`s `Move up`, `Move down`, `Edit step`, `Delete step`: up disabled on the first card, down on the last. Clicking the title block also edits. Move, edit and delete stay enabled on a read-only card (QBZ-47).
  - Dragging (README 3): the source card is 50% opaque, the drop target gets an orange border and a 4px ring (`isOver`); the handle is the `drag_indicator` icon (`handleRef`), the card is the drop target (`ref`, with `data-sortable-item`). The up and down buttons are the keyboard path. `onReorder(from, to)` is `presenter.moveStep(from, to)` (the `to` index is the final index, `SortablePresenter` computes it from the drop edge).
- **Wiring in the layout:** the layout gets one more prop, `drawer` (a node: the step drawer, mounted once beside the editor; `WorkflowEditorView` passes `<StepDrawer source={presenter} stepId={vm.openStepId} />`, R284: the drawer opens and closes its own presenter from `stepId` and calls `source.closeStep()` when it closes itself). The flow's callbacks are presenter commands: add `presenter.openTypePicker(index)` (Task 17), edit `presenter.openStep(stepId)` (R284: it sets `vm.openStepId`; the drawer follows it), move `presenter.moveStep(from, to)`, delete `presenter.requestDeleteStep(stepId)` (asks `Delete step?`, Task 18).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/components/getStepTypeIcon.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/StepCard.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`
- Create: `packages/app-workflows/src/editor/testing/fakeSortablePresenter.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`

**Interfaces:**
- Consumes: Task 15 (`WorkflowEditorViewPresenter`, `WorkflowEditorLayout`, `WorkflowEditorView`, `createEditorViewModel`, `createFakeEditorViewPresenter`, `renderWithContainer`), Task 8 (`StepTypeId` in `[AWE]/domain/StepTypeId.ts`), Task 9 (`StepCardVm`, `WorkflowFlowVm`, `ScrollRequestVm`; `vm.flow`, `vm.scrollRequest`, the commands `openTypePicker`, `moveStep`, `requestDeleteStep`), Task 14 (`StepDrawer` in `[AWE]/presentation/stepDrawer/components/StepDrawer.tsx`, no props). Existing (verified): `SortablePresenter` and its types (`@webiny/app-admin/presentation/sortable/index.js`; `init({ type, onReorder })`, `getItemProps(index)` returning `{ ref, handleRef, isDragging, isOver, closestEdge }`, `dispose()`; registered by `SortableFeature` in `Admin.tsx:55`, A98), `useContainer` (`@webiny/app`), admin-ui `Icon`, `IconButton`, `Tag`, `Button`, `Text`, `cn`, icons `@webiny/icons/{arrow_upward,arrow_downward,edit,delete,drag_indicator,warning,group,bolt,auto_awesome,edit_note,public,add}.svg`.
- Produces: `getStepTypeIcon` (Task 17), `StepCard`, `WorkflowFlow`, `createFakeSortable` (`FakeSortablePresenter`), the layout's `drawer` prop and the flow area of the layout.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/fakeSortablePresenter.ts` (a vitest fake, R243):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";

export interface FakeSortablePresenter extends SortablePresenter.Interface {
    init: Mock<SortablePresenter.Interface["init"]>;
    getItemProps: Mock<SortablePresenter.Interface["getItemProps"]>;
    dispose: Mock<SortablePresenter.Interface["dispose"]>;
    // The config of the first `init` call.
    config(): SortablePresenter.Config;
}

/*
 * A sortable presenter that records its calls. `itemOverrides` changes the item props of one index
 * (for example `{ 1: { isDragging: true } }`); the refs are mocks.
 */
export const createFakeSortable = (
    itemOverrides: Record<number, Partial<SortablePresenter.ItemProps>> = {}
): FakeSortablePresenter => {
    const init = vi.fn<SortablePresenter.Interface["init"]>();
    const dispose = vi.fn<SortablePresenter.Interface["dispose"]>();
    const getItemProps = vi.fn((index: number): SortablePresenter.ItemProps => {
        const base: SortablePresenter.ItemProps = {
            ref: vi.fn(),
            handleRef: vi.fn(),
            isDragging: false,
            isOver: false,
            closestEdge: null
        };
        return { ...base, ...itemOverrides[index] };
    });
    const config = () => {
        return init.mock.calls[0][0];
    };

    return { init, getItemProps, dispose, config };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx`:

```tsx
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
        const warnings = ["Legal has no members.", "The automation “Send webhook” no longer exists."];
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
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.test.tsx`:

```tsx
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
        const { rerender } = renderWithContainer(
            <WorkflowFlow {...first} />,
            createContainer(sortable)
        );

        rerender(<WorkflowFlow {...second} />);
        sortable.config().onReorder(2, 0);

        expect(first.onMoveStep).not.toHaveBeenCalled();
        expect(second.onMoveStep).toHaveBeenCalledWith(2, 0);
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
        const { rerender } = renderWithContainer(
            <WorkflowFlow {...first} />,
            createContainer(sortable)
        );
        expect(scroll).toHaveBeenCalledTimes(1);

        rerender(<WorkflowFlow {...createProps({ scrollRequest: { stepId: "s2", nonce: 1 } })} />);
        expect(scroll).toHaveBeenCalledTimes(1);

        rerender(<WorkflowFlow {...createProps({ scrollRequest: { stepId: "s3", nonce: 2 } })} />);
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
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`:

```tsx
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
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx` (the layout now renders a flow, which needs the sortable from a DI container, and takes a `drawer` prop). Replace the import

```tsx
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
```

with

```tsx
import { Container } from "@webiny/di";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
```

and replace

```tsx
const renderLayout = (overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}) => {
    const presenter = createFakeEditorViewPresenter(createEditorViewModel(overrides));
    renderWithAdminUi(<WorkflowEditorLayout presenter={presenter} app={app} />);
    return presenter;
};
```

with

```tsx
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
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx` (the view mounts `StepDrawer`, and the open workflow's flow needs the sortable). Replace the imports block's last four lines

```tsx
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { WorkflowEditorView } from "./WorkflowEditorView.js";
```

with

```tsx
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
```

and replace

```tsx
const createSetup = (status: "loading" | "ready") => {
    const fake = createFakeEditorViewPresenter(createEditorViewModel({ status }));
```

with

```tsx
const createSetup = (status: "loading" | "ready", openStepId: string | null = null) => {
    const fake = createFakeEditorViewPresenter(createEditorViewModel({ status, openStepId }));
```

and replace

```tsx
    const container = new Container();
    container.registerInstance(
        WorkflowEditorPresenter,
        presenter as unknown as WorkflowEditorPresenter.Interface
    );
    return { container, init, dispose };
```

with

```tsx
    const container = new Container();
    container.registerInstance(
        WorkflowEditorPresenter,
        presenter as unknown as WorkflowEditorPresenter.Interface
    );
    container.registerInstance(SortablePresenter, createFakeSortable());
    return { container, init, dispose, presenter };
```

and add this case at the end of the `describe`:

```tsx
    it("renders the step drawer with the presenter as its source and the open step id", () => {
        const { container, presenter } = createSetup("ready", "step-1");
        drawerProps.calls.length = 0;

        renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
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
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        const last = drawerProps.calls[drawerProps.calls.length - 1];
        expect(last.stepId).toBeNull();
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
```

Expected: `StepCard.test.tsx` and `WorkflowFlow.test.tsx` fail with `Failed to resolve import` for `./StepCard.js` and `./WorkflowFlow.js`. `WorkflowEditorLayoutFlow.test.tsx` fails the flow cases (`Draft` is not rendered) and the `drawer` is not mounted. The two modified files still pass the old cases and fail the new one (`step-drawer` not found). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/components/getStepTypeIcon.tsx`:

```tsx
import React from "react";
import { ReactComponent as AutoAwesomeIcon } from "@webiny/icons/auto_awesome.svg";
import { ReactComponent as BoltIcon } from "@webiny/icons/bolt.svg";
import { ReactComponent as GroupIcon } from "@webiny/icons/group.svg";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";

// The type tag and picker icon of a step type (design README 3): People, Automation, AI; none for an unknown type.
export const getStepTypeIcon = (type: string): React.ReactElement | null => {
    if (type === StepTypeId.Review) {
        return <GroupIcon />;
    }
    if (type === StepTypeId.Automation) {
        return <BoltIcon />;
    }
    if (type === StepTypeId.Ai) {
        return <AutoAwesomeIcon />;
    }
    return null;
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/StepCard.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as ArrowDownwardIcon } from "@webiny/icons/arrow_downward.svg";
import { ReactComponent as ArrowUpwardIcon } from "@webiny/icons/arrow_upward.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as WarningIcon } from "@webiny/icons/warning.svg";
import type { StepCardVm } from "~/editor/presentation/editor/abstractions.js";
import { getStepTypeIcon } from "./getStepTypeIcon.js";

export interface StepCardProps {
    step: StepCardVm;
    index: number;
    sortable: SortablePresenter.ItemProps;
    onEdit(stepId: string): void;
    onMove(from: number, to: number): void;
    onDelete(stepId: string): void;
}

/*
 * One step of the flow (design README 3): number in the step colour, title, type tag, summary,
 * warning lines, error strip, up, down, edit and delete, and the drag handle. The sortable item
 * props make the card a drop target and the handle the drag source.
 */
export const StepCard = (props: StepCardProps) => {
    const { step, index, sortable } = props;

    // One border colour at a time: `cn` does not merge `border-primary`-style classes.
    let borderClass = "border-neutral-muted";
    if (step.error !== null) {
        borderClass = "border-destructive-default";
    }
    if (sortable.isOver) {
        borderClass = "border-accent-default ring-lg ring-primary-dimmed";
    }
    const cardClass = cn(
        "relative flex flex-col gap-sm rounded-lg border-sm bg-neutral-base p-md",
        borderClass
    );
    let opacity = 1;
    if (sortable.isDragging) {
        opacity = 0.5;
    }

    let readOnlyTag: React.ReactNode = null;
    if (step.readOnly) {
        readOnlyTag = <Tag variant="neutral-light" content="Read-only" />;
    }

    let errorStrip: React.ReactNode = null;
    if (step.error !== null) {
        errorStrip = (
            <div
                role="alert"
                className="rounded-sm bg-destructive-subtle px-sm py-xs text-sm text-neutral-primary"
            >
                {step.error}
            </div>
        );
    }

    return (
        <div
            ref={sortable.ref}
            data-sortable-item=""
            data-step-id={step.id}
            data-testid={`step-card-${step.id}`}
            className={cardClass}
            style={{ opacity }}
        >
            <div className="flex items-center gap-sm">
                <span ref={sortable.handleRef} className="shrink-0 flex cursor-grab">
                    <Icon icon={<DragIndicatorIcon />} label="Drag to reorder" size="sm" />
                </span>
                <span
                    style={{ backgroundColor: step.color }}
                    className="shrink-0 flex items-center justify-center size-[28px] rounded-full text-sm font-semibold text-neutral-light"
                >
                    {step.number}
                </span>
                <button
                    type="button"
                    className="grow min-w-0 text-left"
                    onClick={() => props.onEdit(step.id)}
                >
                    <Text as="span" size="md" className="block font-semibold truncate">
                        {step.title}
                    </Text>
                    <Text as="span" size="sm" className="block text-neutral-strong truncate">
                        {step.summary}
                    </Text>
                </button>
                <Tag
                    variant="neutral-base-outline"
                    icon={getStepTypeIcon(step.type)}
                    content={step.typeLabel}
                />
                {readOnlyTag}
                <div className="shrink-0 flex items-center gap-xxs">
                    <IconButton
                        aria-label="Move up"
                        variant="ghost"
                        size="sm"
                        icon={<ArrowUpwardIcon />}
                        disabled={!step.canMoveUp}
                        onClick={() => props.onMove(index, index - 1)}
                    />
                    <IconButton
                        aria-label="Move down"
                        variant="ghost"
                        size="sm"
                        icon={<ArrowDownwardIcon />}
                        disabled={!step.canMoveDown}
                        onClick={() => props.onMove(index, index + 1)}
                    />
                    <IconButton
                        aria-label="Edit step"
                        variant="ghost"
                        size="sm"
                        icon={<EditIcon />}
                        onClick={() => props.onEdit(step.id)}
                    />
                    <IconButton
                        aria-label="Delete step"
                        variant="ghost"
                        size="sm"
                        icon={<DeleteIcon />}
                        onClick={() => props.onDelete(step.id)}
                    />
                </div>
            </div>
            {step.warnings.map((warning, warningIndex) => (
                <div
                    key={`${warningIndex}:${warning}`}
                    className="flex items-start gap-xs text-sm text-neutral-primary"
                >
                    <Icon icon={<WarningIcon />} label="Warning" size="sm" className="fill-warning" />
                    <span>{warning}</span>
                </div>
            ))}
            {errorStrip}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useRef } from "react";
import { Button } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { useContainer } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditNoteIcon } from "@webiny/icons/edit_note.svg";
import { ReactComponent as PublicIcon } from "@webiny/icons/public.svg";
import type { ScrollRequestVm } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowFlowVm } from "~/editor/presentation/editor/abstractions.js";
import { StepCard } from "./StepCard.js";

export interface WorkflowFlowProps {
    flow: WorkflowFlowVm;
    scrollRequest: ScrollRequestVm | null;
    onAddStep(index: number): void;
    onEditStep(stepId: string): void;
    onMoveStep(from: number, to: number): void;
    onDeleteStep(stepId: string): void;
}

interface EndCardProps {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    description: string;
}

interface ConnectorProps {
    index: number;
    onAdd(index: number): void;
}

const EndCard = ({ icon, iconClass, title, description }: EndCardProps) => {
    return (
        <div className="flex items-center gap-sm rounded-lg border-sm border-dashed border-neutral-muted p-md">
            <span aria-hidden="true" className={cn("shrink-0 flex", iconClass)}>
                {icon}
            </span>
            <div className="flex flex-col">
                <Text as="div" size="md" className="font-semibold">
                    {title}
                </Text>
                <Text as="div" size="sm" className="text-neutral-strong">
                    {description}
                </Text>
            </div>
        </div>
    );
};

const Connector = ({ index, onAdd }: ConnectorProps) => {
    return (
        <div className="flex justify-center py-xs">
            <IconButton
                aria-label="Add step"
                variant="tertiary"
                size="sm"
                className="rounded-full"
                icon={<AddIcon />}
                onClick={() => onAdd(index)}
            />
        </div>
    );
};

const DraftCard = () => {
    return (
        <EndCard
            icon={<EditNoteIcon />}
            iconClass=""
            title="Draft"
            description="The author saves a revision and requests a review."
        />
    );
};

const PublishedCard = () => {
    return (
        <EndCard
            icon={<PublicIcon />}
            iconClass="fill-success"
            title="Published"
            description="Publishing is allowed once every step approves."
        />
    );
};

/*
 * The vertical flow (design README 3, UI-11): Draft, the numbered step cards with a + before each
 * and after the last, Published. Steps reorder by drag (`SortablePresenter`, one instance per flow)
 * or by the cards' up and down buttons. A new `scrollRequest` scrolls its card into view (R276).
 */
export const WorkflowFlow = createReactiveComponent(function WorkflowFlow(
    props: WorkflowFlowProps
) {
    const { flow, scrollRequest } = props;
    const { steps, stepsError } = flow;
    const container = useContainer();
    const rootRef = useRef<HTMLDivElement>(null);

    const onMoveStepRef = useRef(props.onMoveStep);
    onMoveStepRef.current = props.onMoveStep;

    const sortable = useMemo(() => {
        const presenter = container.resolve(SortablePresenter);
        presenter.init({
            type: "workflow-steps",
            onReorder: (from, to) => onMoveStepRef.current(from, to)
        });
        return presenter;
    }, [container]);

    useEffect(() => {
        return () => sortable.dispose();
    }, [sortable]);

    let scrollStepId: string | null = null;
    let scrollNonce: number | null = null;
    if (scrollRequest !== null) {
        scrollStepId = scrollRequest.stepId;
        scrollNonce = scrollRequest.nonce;
    }

    useEffect(() => {
        if (scrollStepId === null || rootRef.current === null) {
            return;
        }

        const cards = rootRef.current.querySelectorAll("[data-step-id]");
        for (const card of Array.from(cards)) {
            if (card.getAttribute("data-step-id") === scrollStepId) {
                card.scrollIntoView({ block: "center", behavior: "smooth" });
                return;
            }
        }
    }, [scrollStepId, scrollNonce]);

    if (steps.length === 0) {
        const boxClass = cn(
            "flex flex-col items-center gap-sm rounded-lg border-sm border-dashed p-lg",
            stepsError === null && "border-neutral-muted",
            stepsError !== null && "border-destructive-default"
        );
        let error: React.ReactNode = null;
        if (stepsError !== null) {
            error = (
                <Text size="sm" className="text-destructive-primary">
                    {stepsError}
                </Text>
            );
        }
        return (
            <div ref={rootRef} className="mx-auto flex w-full max-w-[680px] flex-col gap-md">
                <DraftCard />
                <div data-testid="no-steps" className={boxClass}>
                    <Text size="md" className="font-semibold">
                        No steps yet
                    </Text>
                    {error}
                    <Button
                        variant="secondary"
                        text="Add step"
                        onClick={() => props.onAddStep(0)}
                    />
                </div>
                <PublishedCard />
            </div>
        );
    }

    return (
        <div ref={rootRef} className="mx-auto flex w-full max-w-[680px] flex-col">
            <DraftCard />
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    <Connector index={index} onAdd={props.onAddStep} />
                    <StepCard
                        step={step}
                        index={index}
                        sortable={sortable.getItemProps(index)}
                        onEdit={props.onEditStep}
                        onMove={props.onMoveStep}
                        onDelete={props.onDeleteStep}
                    />
                </React.Fragment>
            ))}
            <Connector index={steps.length} onAdd={props.onAddStep} />
            <PublishedCard />
        </div>
    );
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`. Add the import after `import { NoWorkflowState } from "./NoWorkflowState.js";`:

```tsx
import { WorkflowFlow } from "./WorkflowFlow.js";
```

In `WorkflowEditorLayoutProps` add after `app: Pick<WorkflowEditorAppAdapter, "renderModelIcon">;`:

```tsx
    // The step drawer, mounted once beside the editor (`WorkflowEditorView` passes `<StepDrawer source={presenter} stepId={vm.openStepId} />`, R284: the drawer opens and closes its own presenter from `stepId` and calls `source.closeStep()` when it closes itself).
    drawer: React.ReactNode;
```

Replace

```tsx
    const { presenter, app } = props;
```

with

```tsx
    const { presenter, app, drawer } = props;
```

Replace the line

```tsx
                <div className="grow overflow-y-auto p-lg" />
```

with

```tsx
                <div className="grow overflow-y-auto p-lg">
                    <WorkflowFlow
                        flow={vm.flow}
                        scrollRequest={vm.scrollRequest}
                        onAddStep={index => presenter.openTypePicker(index)}
                        onEditStep={stepId => presenter.openStep(stepId)}
                        onMoveStep={(from, to) => presenter.moveStep(from, to)}
                        onDeleteStep={stepId => presenter.requestDeleteStep(stepId)}
                    />
                </div>
```

Replace the line

```tsx
            <div className="flex flex-col min-w-0 overflow-hidden">{content}</div>
```

with

```tsx
            <div className="flex flex-col min-w-0 overflow-hidden">{content}</div>
            {drawer}
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`. Add the import after `import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";`:

```tsx
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
```

and replace

```tsx
    return <WorkflowEditorLayout presenter={presenter} app={app} />;
```

with

```tsx
    return (
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<StepDrawer source={presenter} stepId={presenter.vm.openStepId} />}
        />
    );
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (a) jsdom normalises the hex `background-color` to `rgb(59, 111, 212)`; the test uses a hex on purpose, a `var(--…)` colour is not asserted because jsdom's CSS parser may drop it; (b) `IconButton` sets `aria-disabled={disabled}`: the up and down buttons always get a boolean and render `"true"` or `"false"`, while the edit and delete buttons get no `disabled` prop and render no attribute, which is why the read-only test asserts `not.toBe("true")`; (c) the scroll tests spy on `Element.prototype.scrollIntoView`, which `__tests__/setup/setupDom.ts` defines for cmdk, and read the element it was called on from `mock.contexts`; the `afterEach` restores the spy; (d) the `StepDrawer` mock in the view test replaces Task 14's real drawer, which needs the drawer presenter feature and FormModel.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/StepCard.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. A type error on `presenter={presenter}` or on `<StepDrawer source={presenter} ...>` means the presenter or the drawer (Tasks 9, 9b, 14) differs from R284; fix it there.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow flow and step cards" -m "The flow shows the Draft card, numbered step cards with a + before each and after the last, the Published card and the No steps yet box. A step card shows number, title, type tag, summary, warning lines and an error strip with up, down, edit, delete and a drag handle over the admin sortable presenter; the card the presenter names scrolls into view." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No new DI feature, nothing to register.** `SortablePresenter` is registered by app-admin's `SortableFeature` (A98); the flow resolves it with `useContainer().resolve(SortablePresenter)` in a `useMemo`, the precedent of `ObjectAccordionMultipleRenderer` (the presenter is transient, one per flow; `dispose` on unmount).
- **Opening a step is R284's.** A card's Edit calls `presenter.openStep(stepId)`, which sets `vm.openStepId` (and `addStep` sets it for a new step, Task 17). The view renders `<StepDrawer source={presenter} stepId={vm.openStepId} />` (Task 14, `presentation/stepDrawer/StepDrawer.tsx`); the drawer opens and closes its own presenter from `stepId` and calls `source.closeStep()` when it closes itself, so the view has no drawer logic. Task 14 and the presenter agree on `getNamespace` and the options shape; the view only passes the presenter.
- **Move buttons follow `StepCardVm.canMoveUp` and `canMoveDown`** (Task 9b), not the card's position.
- **Drag styling:** one border colour class at a time (`border-accent-default` on the drop target), because `cn` does not merge `border-primary`-style classes with `border-neutral-muted`; StrictMode note: the sortable is created in `useMemo` and disposed in an effect cleanup, the precedent pattern of `ObjectAccordionMultipleRenderer`.
- **`moveStep(from, to)`** is Task 9's, `to` the final index (checked by the consistency pass: Task 8's `WorkflowDraft.moveStep` removes then inserts, and `SortablePresenter.computeDestination` returns the final index).
- **`scrollRequest` (Tasks 9 and 10)** is consumed here, as Task 9's Contract notes asked: `WorkflowFlow` finds the card by `data-step-id` inside its own root and scrolls it on a new `nonce` (the editor presenter sets it for client errors and a server step error). `StepCard` carries `data-step-id`; nothing else needs the id.
- **Accessible labels without a design source** (not visible text; accepted by the user, Q48): `Add step` (the `+` connectors reuse the design's button label), `Move up`, `Move down`, `Edit step`, `Delete step`, `Drag to reorder`, `Warning`.
- **Colour on a custom hex:** the presenter passes the colour string through; the card never validates it (an invalid hex cannot reach the draft, R273).
- **No `Rule n:` strips in 9a:** assignment rules arrive with 9b, so the strip carries client messages and an unmatched server field's text only.
