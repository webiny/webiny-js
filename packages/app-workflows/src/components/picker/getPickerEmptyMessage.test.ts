import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getPickerEmptyMessage } from "./getPickerEmptyMessage.js";

describe("getPickerEmptyMessage", () => {
    it("names the search text", () => {
        expect(getPickerEmptyMessage("leg")).toBe("Nothing matches “leg”.");
    });

    it("gives the library's own text when nothing was typed", () => {
        expect(getPickerEmptyMessage("")).toBe("No results.");
    });
});
