import { Mock } from "vitest";

export function getLastCall(callable: Mock) {
    return callable.mock.calls[callable.mock.calls.length - 1][0];
}
