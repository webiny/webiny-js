// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { createBrowserHistory } from "history";
import { HistoryRouterGateway } from "./HistoryRouterGateway.js";

// Returns whether the browser would show its "Leave site?" prompt.
const dispatchBeforeUnload = (): boolean => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event.defaultPrevented;
};

describe("Router Gateway - beforeunload", () => {
    let gateway: HistoryRouterGateway | undefined;

    afterEach(() => {
        gateway?.destroy();
        gateway = undefined;
    });

    it("should not prompt when no guard blocks", () => {
        gateway = new HistoryRouterGateway(createBrowserHistory(), "");
        gateway.addGuard({ guard: () => false, onBlocked: () => {} });

        expect(dispatchBeforeUnload()).toBe(false);
    });

    it("should prompt when a guard blocks", () => {
        gateway = new HistoryRouterGateway(createBrowserHistory(), "");
        gateway.addGuard({ guard: () => true, onBlocked: () => {} });

        expect(dispatchBeforeUnload()).toBe(true);
    });

    it("should follow the guard as its state changes", () => {
        let dirty = false;
        gateway = new HistoryRouterGateway(createBrowserHistory(), "");
        gateway.addGuard({ guard: () => dirty, onBlocked: () => {} });

        expect(dispatchBeforeUnload()).toBe(false);
        dirty = true;
        expect(dispatchBeforeUnload()).toBe(true);
        dirty = false;
        expect(dispatchBeforeUnload()).toBe(false);
    });

    it("should not prompt once the last guard is removed", () => {
        gateway = new HistoryRouterGateway(createBrowserHistory(), "");
        const dispose = gateway.addGuard({ guard: () => true, onBlocked: () => {} });
        dispose();

        expect(dispatchBeforeUnload()).toBe(false);
    });
});
