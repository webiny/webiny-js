import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { formatTimeOfDay } from "./formatTimeOfDay.js";

describe("formatTimeOfDay", () => {
    it("writes a 24-hour HH:MM with padding", () => {
        expect(formatTimeOfDay(new Date(2026, 9, 6, 9, 5))).toBe("09:05");
        expect(formatTimeOfDay(new Date(2026, 9, 6, 14, 20))).toBe("14:20");
    });
});
