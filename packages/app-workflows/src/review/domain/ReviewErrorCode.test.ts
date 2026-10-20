import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { ReviewErrorCode } from "./ReviewErrorCode.js";

describe("ReviewErrorCode", () => {
    it("pins the two codes 8b adds to the server's strings (R257, R266)", () => {
        expect(ReviewErrorCode.TargetSync).toBe("Workflows/Review/TargetSync");
        expect(ReviewErrorCode.StepRunNotFound).toBe("Workflows/Review/StepRunNotFound");
    });
});
