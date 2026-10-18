import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import type { PickerOption } from "./PickerOption.js";
import { limitPickerOptions } from "./limitPickerOptions.js";

const createOptions = (count: number): PickerOption[] => {
    return Array.from({ length: count }, (_, index) => {
        return createPickerOption({ id: `id-${index}`, label: `Item ${index}` });
    });
};

describe("limitPickerOptions", () => {
    it("returns an empty list as it is", () => {
        expect(limitPickerOptions([])).toEqual({ options: [], hasMore: false });
    });

    it("returns 50 options or fewer as they are", () => {
        const options = createOptions(50);

        const limited = limitPickerOptions(options);

        expect(limited.options).toHaveLength(50);
        expect(limited.hasMore).toBe(false);
    });

    it("cuts more than 50 options to the first 50 and says there are more", () => {
        const options = createOptions(51);

        const limited = limitPickerOptions(options);

        expect(limited.options).toHaveLength(50);
        expect(limited.options[0].id).toBe("id-0");
        expect(limited.options[49].id).toBe("id-49");
        expect(limited.hasMore).toBe(true);
    });
});
