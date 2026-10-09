import { describe, expect, it } from "vitest";
import { degradedSummary, finishedSummary, formatElapsed } from "./waiting.js";

describe("formatElapsed", () => {
    it("reads as minutes and seconds, never negative", () => {
        expect(formatElapsed(38)).toBe("38 s");
        expect(formatElapsed(252)).toBe("4 min 12 s");
        expect(formatElapsed(-5)).toBe("0 s");
    });
});

describe("degradedSummary", () => {
    it("names per-item failures of a finished capture or generate", () => {
        expect(degradedSummary("capture", { failed: ["a", "b"] })).toBe(
            "2 pages could not be captured. They are listed first below, with the reason."
        );
        expect(degradedSummary("generate", { failed: ["x"] })).toBe(
            "1 component did not pass its checks. The failed checks are on its card below."
        );
        expect(
            degradedSummary("generate", {
                failed: ["x", "y"],
                components: [
                    { signature: "x", name: "Site Header" },
                    { signature: "y", name: "Footer" }
                ]
            })
        ).toBe(
            "2 components did not pass their checks: Site Header, Footer. The failed checks are on their cards below."
        );
    });

    it("says nothing when nothing failed or the artifact is not loaded", () => {
        expect(degradedSummary("capture", { failed: [] })).toBeNull();
        expect(degradedSummary("generate", null)).toBeNull();
        expect(degradedSummary("segment", { failed: ["a"] })).toBeNull();
    });
});

describe("finishedSummary", () => {
    it("states what a finished stage produced", () => {
        const counts = { pages: 5, sections: 37, clusters: 25, components: 24 };
        expect(finishedSummary("capture", counts)).toBe("5 pages captured.");
        expect(finishedSummary("generate", counts)).toBe("24 components.");
        expect(finishedSummary("discover", counts)).toBe("5 pages found to capture.");
        expect(finishedSummary("classify", counts)).toBe("25 groups named.");
        expect(finishedSummary("assemble", counts)).toBe("5 pages rebuilt from the components.");
        expect(finishedSummary("promote", counts)).toBeNull();
    });
});
