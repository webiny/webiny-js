import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { startOfDay } from "./startOfDay.js";

describe("startOfDay", () => {
    it("returns the local midnight of the day as a timestamp", () => {
        const result = startOfDay(new Date(2026, 9, 6, 14, 20, 30));
        expect(result).toBe(new Date(2026, 9, 6).getTime());
    });
});
