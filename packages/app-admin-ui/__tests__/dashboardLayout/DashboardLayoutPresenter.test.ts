import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { SaveDashboardLayoutUseCase } from "~/Dashboard/dashboardLayout/saveLayout/abstractions.js";
import { DashboardLayoutPresenter as PresenterAbstraction } from "~/Dashboard/dashboardLayout/presenter/abstractions.js";
import { DashboardLayoutPresenter } from "~/Dashboard/dashboardLayout/presenter/DashboardLayoutPresenter.js";
import type { DashboardLayoutData } from "~/Dashboard/dashboardLayout/types.js";

const WIDGETS = [
    { name: "a", column: 0 },
    { name: "b", column: 0 },
    { name: "c", column: 1 }
];

// Records every save and lets the test decide when each one finishes.
function createControlledSaves() {
    const calls: DashboardLayoutData[] = [];
    const resolvers: (() => void)[] = [];

    const execute = (layout: DashboardLayoutData): Promise<void> => {
        calls.push(layout);
        return new Promise(resolve => {
            resolvers.push(resolve);
        });
    };

    const finishNext = async (): Promise<void> => {
        const resolve = resolvers.shift();
        resolve?.();
        // Let the presenter's queue pick up the next save.
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    return { calls, execute, finishNext };
}

function setup() {
    const saves = createControlledSaves();

    class FakeSaveDashboardLayoutUseCase implements SaveDashboardLayoutUseCase.Interface {
        execute = saves.execute;
    }

    const SaveImpl = SaveDashboardLayoutUseCase.createImplementation({
        implementation: FakeSaveDashboardLayoutUseCase,
        dependencies: []
    });

    const container = new Container();
    container.register(SaveImpl);
    container.register(DashboardLayoutPresenter);
    const presenter = container.resolve(PresenterAbstraction);

    return { presenter, saves };
}

describe("DashboardLayoutPresenter", () => {
    it("sends one save at a time and keeps only the newest queued layout", async () => {
        const { presenter, saves } = setup();
        presenter.init("user-1", WIDGETS, null);

        presenter.setColumnCount(3);
        presenter.setColumnCount(4);
        presenter.removeWidget("a");

        // The first save is in flight; the two later changes collapse into one queued save.
        expect(saves.calls).toHaveLength(1);
        expect(saves.calls[0].columnCount).toBe(3);

        await saves.finishNext();

        expect(saves.calls).toHaveLength(2);
        expect(saves.calls[1].columnCount).toBe(4);
        expect(saves.calls[1].hidden).toEqual(["a"]);

        await saves.finishNext();
        expect(saves.calls).toHaveLength(2);
    });

    it("starts over for a different user and drops the previous user's queued save", async () => {
        const { presenter, saves } = setup();
        presenter.init("user-1", WIDGETS, null);

        presenter.removeWidget("a");
        presenter.removeWidget("b");
        expect(saves.calls).toHaveLength(1);

        const secondUserLayout = { columns: [["c"], ["a", "b"]], hidden: [], columnCount: 2 };
        presenter.init("user-2", WIDGETS, secondUserLayout);

        expect(presenter.vm.columns).toEqual([["c"], ["a", "b"]]);
        expect(presenter.vm.hidden).toEqual([]);

        await saves.finishNext();

        // The queued "hide b" belonged to user 1, so it must not be sent.
        expect(saves.calls).toHaveLength(1);
    });

    it("adds a widget to the column the user picks", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        presenter.removeWidget("a");

        presenter.addWidget("a", 1);

        expect(presenter.vm.hidden).toEqual([]);
        expect(presenter.vm.columns).toEqual([["b"], ["c", "a"]]);
    });

    it("adds a widget to its default column when no column is given", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        presenter.removeWidget("c");

        presenter.addWidget("c");

        expect(presenter.vm.columns).toEqual([["a", "b"], ["c"]]);
    });

    it("turns Customize mode on and off, and ends a drag when it turns off", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        expect(presenter.vm.editing).toBe(false);

        presenter.startEditing();
        presenter.beginDrag("a");
        expect(presenter.vm.editing).toBe(true);

        presenter.stopEditing();
        expect(presenter.vm.editing).toBe(false);
        expect(presenter.vm.draggingName).toBeNull();
    });

    it("resets Customize mode on dispose, so the next visit opens normally", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        presenter.removeWidget("a");
        presenter.startEditing();
        presenter.beginDrag("b");

        presenter.dispose();

        expect(presenter.vm.editing).toBe(false);
        expect(presenter.vm.draggingName).toBeNull();
        // The layout itself survives.
        expect(presenter.vm.hidden).toEqual(["a"]);
    });

    it("leaves Customize mode when a different user signs in", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        presenter.startEditing();

        presenter.init("user-2", WIDGETS, null);

        expect(presenter.vm.editing).toBe(false);
    });

    it("keeps the current layout when the same user's widgets are re-registered", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS, null);
        presenter.removeWidget("a");

        presenter.init("user-1", WIDGETS, null);

        expect(presenter.vm.hidden).toEqual(["a"]);
    });
});
