import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewErrorCode } from "./ReviewErrorCode.js";

describe("ReviewErrorCode", () => {
    it("pins the code 8b adds to the server's string (R266)", () => {
        expect(ReviewErrorCode.TargetSync).toBe("Workflows/Review/TargetSync");
    });
});
