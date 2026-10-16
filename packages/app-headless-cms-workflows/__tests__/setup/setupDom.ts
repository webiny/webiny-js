import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

// jsdom has no ResizeObserver; Radix tooltips and popovers need one.
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
    cleanup();
});
