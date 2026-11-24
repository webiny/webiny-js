// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { observable, runInAction } from "mobx";
import { useSelectFromState } from "./useSelectFromState.js";

interface TestState {
    bindings: Record<string, { value: unknown }>;
}

function subscribe(state: TestState, elementId: string) {
    let renders = 0;
    const hook = renderHook(() => {
        renders++;
        return useSelectFromState(
            () => state,
            current => ({ ...current.bindings[elementId] }),
            [elementId]
        );
    });
    return { hook, renders: () => renders };
}

describe("useSelectFromState", () => {
    it("returns the new slice when its value changes", () => {
        const state = observable<TestState>({ bindings: { a: { value: "one" } } });
        const { hook } = subscribe(state, "a");

        act(() => runInAction(() => (state.bindings.a.value = "two")));

        expect(hook.result.current).toEqual({ value: "two" });
    });

    // The default comparator is strict: a loose one (`deep-equal`'s default, `1 == "1"`) kept the
    // old value when only the type changed, e.g. a radio input's value from 1 to "1".
    it("returns the new slice when only the value's type changes", () => {
        const state = observable<TestState>({ bindings: { a: { value: 1 } } });
        const { hook } = subscribe(state, "a");

        act(() => runInAction(() => (state.bindings.a.value = "1")));

        expect(hook.result.current).toEqual({ value: "1" });
    });

    it("doesn't re-render when another element's bindings change", () => {
        const state = observable<TestState>({
            bindings: { a: { value: "one" }, b: { value: "x" } }
        });
        const { renders } = subscribe(state, "a");
        const before = renders();

        act(() => runInAction(() => (state.bindings.b.value = "y")));

        expect(renders()).toBe(before);
    });
});
