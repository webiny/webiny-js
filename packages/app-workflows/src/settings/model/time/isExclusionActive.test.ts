import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { isExclusionActive } from "./isExclusionActive.js";

const ENDS_ON = "2026-10-20T21:59:59.999Z";
const ENDS_AT = Date.parse(ENDS_ON);

describe("isExclusionActive (R319, D110)", () => {
    it("is active without an end date", () => {
        const exclusion = createExclusion({ endsOn: null });

        expect(isExclusionActive(exclusion, ENDS_AT)).toBe(true);
    });

    it("is active until the instant before its end", () => {
        const exclusion = createExclusion({ endsOn: ENDS_ON });

        expect(isExclusionActive(exclusion, ENDS_AT - 1)).toBe(true);
    });

    it("is expired at its end and after it", () => {
        const exclusion = createExclusion({ endsOn: ENDS_ON });

        expect(isExclusionActive(exclusion, ENDS_AT)).toBe(false);
        expect(isExclusionActive(exclusion, ENDS_AT + 1)).toBe(false);
    });
});
