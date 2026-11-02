import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { renderHook } from "@testing-library/react";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { usePickerRemountKey } from "./usePickerRemountKey.js";

const legal = createPickerOption({ id: "t1", label: "Legal" });
const press = createPickerOption({ id: "t2", label: "Press" });

describe("usePickerRemountKey", () => {
    it("keeps the key while the chosen items stay the same", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal }] });

        expect(result.current).toBe(first);
    });

    it("keeps the key when an item is added", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [legal, press] });

        expect(result.current).toBe(first);
    });

    it("changes the key when an item is removed", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal, press] }
        });
        const first = result.current;

        rerender({ chosen: [press] });

        expect(result.current).not.toBe(first);
    });

    it("changes the key when an item's label changes", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal, label: "Legal team" }] });

        expect(result.current).not.toBe(first);
    });

    it("changes the key when an item's warning changes", () => {
        const { result, rerender } = renderHook(props => usePickerRemountKey(props.chosen), {
            initialProps: { chosen: [legal] }
        });
        const first = result.current;

        rerender({ chosen: [{ ...legal, warning: "This team has no members" }] });

        expect(result.current).not.toBe(first);
    });
});
