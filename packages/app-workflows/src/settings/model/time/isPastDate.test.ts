import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isPastDate } from "./isPastDate.js";

describe("isPastDate (R319, QBZ-30)", () => {
    it("is true only for a day before today", () => {
        expect(isPastDate("2026-10-19", "2026-10-20")).toBe(true);
        expect(isPastDate("2025-12-31", "2026-01-01")).toBe(true);
        expect(isPastDate("2026-10-20", "2026-10-20")).toBe(false);
        expect(isPastDate("2026-10-21", "2026-10-20")).toBe(false);
    });
});
