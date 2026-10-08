import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { GetCachedDashboardLayoutUseCase } from "~/Dashboard/dashboardLayout/loadLayout/abstractions.js";
import { FetchDashboardLayoutUseCase } from "~/Dashboard/dashboardLayout/loadLayout/abstractions.js";
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

    const execute = (_userId: string, layout: DashboardLayoutData): Promise<void> => {
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

// Hands out one pending fetch per init, which the test answers when it wants to.
function createControlledFetches() {
    const resolvers: ((layout: DashboardLayoutData | null) => void)[] = [];

    const execute = (): Promise<DashboardLayoutData | null> => {
        return new Promise(resolve => {
            resolvers.push(resolve);
        });
    };

    const answerNext = async (layout: DashboardLayoutData | null): Promise<void> => {
        const resolve = resolvers.shift();
        resolve?.(layout);
        await new Promise(resolve => setTimeout(resolve, 0));
    };

    return { execute, answerNext };
}

function setup(cached: Record<string, DashboardLayoutData> = {}) {
    const saves = createControlledSaves();
    const fetches = createControlledFetches();

    const container = new Container();
    container.registerInstance(GetCachedDashboardLayoutUseCase, {
        execute: (userId: string) => cached[userId] ?? null
    });
    container.registerInstance(FetchDashboardLayoutUseCase, { execute: fetches.execute });
    container.registerInstance(SaveDashboardLayoutUseCase, { execute: saves.execute });
    container.register(DashboardLayoutPresenter);
    const presenter = container.resolve(PresenterAbstraction);

    return { presenter, saves, fetches };
}

describe("DashboardLayoutPresenter", () => {
    it("sends one save at a time and keeps only the newest queued layout", async () => {
        const { presenter, saves } = setup();
        presenter.init("user-1", WIDGETS);

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
        const secondUserLayout = { columns: [["c"], ["a", "b"]], hidden: [], columnCount: 2 };
        const { presenter, saves } = setup({ "user-2": secondUserLayout });
        presenter.init("user-1", WIDGETS);

        presenter.removeWidget("a");
        presenter.removeWidget("b");
        expect(saves.calls).toHaveLength(1);

        presenter.init("user-2", WIDGETS);

        expect(presenter.vm.columns).toEqual([["c"], ["a", "b"]]);
        expect(presenter.vm.hidden).toEqual([]);

        await saves.finishNext();

        // The queued "hide b" belonged to user 1, so it must not be sent.
        expect(saves.calls).toHaveLength(1);
    });

    it("adds a widget to the column the user picks", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS);
        presenter.removeWidget("a");

        presenter.addWidget("a", 1);

        expect(presenter.vm.hidden).toEqual([]);
        expect(presenter.vm.columns).toEqual([["b"], ["c", "a"]]);
    });

    it("adds a widget to its default column when no column is given", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS);
        presenter.removeWidget("c");

        presenter.addWidget("c");

        expect(presenter.vm.columns).toEqual([["a", "b"], ["c"]]);
    });

    it("turns Customize mode on and off, and ends a drag when it turns off", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS);
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
        presenter.init("user-1", WIDGETS);
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
        presenter.init("user-1", WIDGETS);
        presenter.startEditing();

        presenter.init("user-2", WIDGETS);

        expect(presenter.vm.editing).toBe(false);
    });

    it("keeps the current layout when the same user's widgets are re-registered", () => {
        const { presenter } = setup();
        presenter.init("user-1", WIDGETS);
        presenter.removeWidget("a");

        presenter.init("user-1", WIDGETS);

        expect(presenter.vm.hidden).toEqual(["a"]);
    });

    it("renders the cached layout before the fetch finishes", () => {
        const cached = { columns: [["c"], ["b"]], hidden: ["a"], columnCount: 2 };
        const { presenter } = setup({ "user-1": cached });

        presenter.init("user-1", WIDGETS);

        expect(presenter.vm.columns).toEqual([["c"], ["b"]]);
        expect(presenter.vm.hidden).toEqual(["a"]);
    });

    it("replaces the cached layout with the fetched one", async () => {
        const cached = { columns: [["c"], ["b"]], hidden: ["a"], columnCount: 2 };
        const { presenter, fetches } = setup({ "user-1": cached });
        presenter.init("user-1", WIDGETS);

        await fetches.answerNext({ columns: [["a"], ["b"], ["c"]], hidden: [], columnCount: 3 });

        expect(presenter.vm.columnCount).toBe(3);
        expect(presenter.vm.columns).toEqual([["a"], ["b"], ["c"]]);
    });

    it("falls back to the default layout when nothing is stored", async () => {
        const cached = { columns: [["c"], ["b"]], hidden: ["a"], columnCount: 2 };
        const { presenter, fetches } = setup({ "user-1": cached });
        presenter.init("user-1", WIDGETS);

        await fetches.answerNext(null);

        expect(presenter.vm.columns).toEqual([["a", "b"], ["c"]]);
        expect(presenter.vm.hidden).toEqual([]);
    });

    it("keeps the user's changes when the fetch finishes after them", async () => {
        const { presenter, fetches } = setup();
        presenter.init("user-1", WIDGETS);
        presenter.removeWidget("a");

        await fetches.answerNext({ columns: [["a", "b", "c"], []], hidden: [], columnCount: 2 });

        expect(presenter.vm.hidden).toEqual(["a"]);
        expect(presenter.vm.columns).toEqual([["b"], ["c"]]);
    });

    it("ignores a fetch that finishes after another user signed in", async () => {
        const { presenter, fetches } = setup();
        presenter.init("user-1", WIDGETS);
        presenter.init("user-2", WIDGETS);

        await fetches.answerNext({ columns: [["c"], ["a", "b"]], hidden: [], columnCount: 2 });

        expect(presenter.vm.columns).toEqual([["a", "b"], ["c"]]);
    });
});
