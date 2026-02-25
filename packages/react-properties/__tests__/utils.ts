import { act } from "@testing-library/react";
import { Mock } from "vitest";

export function getLastCall(callable: Mock) {
    return callable.mock.calls[callable.mock.calls.length - 1][0];
}

/**
 * Wait for the PropertyStore debounced flush to process queued operations.
 */
export async function flush() {
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
    });
}
