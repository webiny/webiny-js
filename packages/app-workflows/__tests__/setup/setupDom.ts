import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

// jsdom has no ResizeObserver; Radix dialogs, popovers and tooltips need one.
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

// cmdk scrolls the selected item into view; jsdom has no scrollIntoView.
Element.prototype.scrollIntoView = () => undefined;

afterEach(() => {
    cleanup();
});
