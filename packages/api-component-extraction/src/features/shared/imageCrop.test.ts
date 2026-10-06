import { describe, it, expect } from "vitest";
import { planSectionCrop } from "./imageCrop.js";

describe("planSectionCrop", () => {
    it("crops a box that is entirely inside the screenshot", () => {
        expect(
            planSectionCrop({ x: 0, y: 100, width: 1440, height: 400 }, 1440, 3000, 1440)
        ).toEqual({
            status: "ok",
            region: { left: 0, top: 100, width: 1440, height: 400 },
            visibleFraction: 1
        });
    });

    it("scales a document-space box into a narrower screenshot", () => {
        const plan = planSectionCrop({ x: 0, y: 1000, width: 1440, height: 400 }, 720, 3000, 1440);
        expect(plan).toEqual({
            status: "ok",
            region: { left: 0, top: 500, width: 720, height: 200 },
            visibleFraction: 1
        });
    });

    it("refuses a box below the bottom of the screenshot instead of returning a 1-pixel crop", () => {
        expect(
            planSectionCrop({ x: 0, y: 5000, width: 1440, height: 600 }, 1440, 3000, 1440)
        ).toEqual({ status: "outside", visibleFraction: 0 });
    });

    it("refuses a box that only grazes the bottom of the screenshot", () => {
        // 10 of 600 rows are in the picture.
        const plan = planSectionCrop({ x: 0, y: 2990, width: 1440, height: 600 }, 1440, 3000, 1440);
        expect(plan.status).toBe("outside");
        expect(plan.visibleFraction).toBeCloseTo(10 / 600);
    });

    it("crops the visible part of a box that is mostly inside, and says it is partial", () => {
        const plan = planSectionCrop({ x: 0, y: 2600, width: 1440, height: 600 }, 1440, 3000, 1440);
        expect(plan).toEqual({
            status: "partial",
            region: { left: 0, top: 2600, width: 1440, height: 400 },
            visibleFraction: 400 / 600
        });
    });

    it("treats a box overrunning the edge by rounding as whole", () => {
        const plan = planSectionCrop({ x: 0, y: 2401, width: 1440, height: 600 }, 1440, 3000, 1440);
        expect(plan.status).toBe("ok");
        if (plan.status !== "outside") {
            expect(plan.region.top + plan.region.height).toBeLessThanOrEqual(3000);
        }
    });

    it("refuses a box with no area, and a screenshot with no size", () => {
        expect(
            planSectionCrop({ x: 0, y: 0, width: 1440, height: 0 }, 1440, 3000, 1440).status
        ).toBe("outside");
        expect(
            planSectionCrop({ x: 0, y: 0, width: 1440, height: 400 }, 1440, 0, 1440).status
        ).toBe("outside");
    });

    it("refuses a strip too thin to show anything even when it is all inside", () => {
        expect(
            planSectionCrop({ x: 0, y: 100, width: 1440, height: 10 }, 1440, 3000, 1440).status
        ).toBe("outside");
    });

    it("clips a box that overruns the right edge", () => {
        const plan = planSectionCrop({ x: 200, y: 0, width: 1440, height: 400 }, 1440, 3000, 1440);
        expect(plan.status).toBe("partial");
        if (plan.status !== "outside") {
            expect(plan.region).toEqual({ left: 200, top: 0, width: 1240, height: 400 });
        }
    });
});
