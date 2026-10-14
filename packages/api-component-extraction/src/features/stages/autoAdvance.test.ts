import { describe, expect, it } from "vitest";
import { decideAutoAdvance } from "./autoAdvance.js";
import type { Stage } from "~/constants.js";

const job = (stopAfter: Stage[], theme: Partial<{ themeEntryId: string }> = {}) => ({
    gateConfig: { stopAfter },
    themeEntryId: theme.themeEntryId ?? "theme-1",
    themeExtraction: null
});

describe("decideAutoAdvance", () => {
    it("hands on to the next stage when the job does not pause after this one", () => {
        expect(decideAutoAdvance(job(["plan"]), "discover")).toEqual({
            kind: "advance",
            next: "capture"
        });
    });

    it("pauses after a stage the job gates on", () => {
        expect(decideAutoAdvance(job(["plan"]), "plan")).toEqual({
            kind: "gate",
            next: "generate"
        });
    });

    it("runs straight through with no gates at all", () => {
        const stages: Stage[] = ["discover", "capture", "segment", "cluster", "classify"];
        for (const stage of stages) {
            expect(decideAutoAdvance(job([]), stage).kind).toBe("advance");
        }
    });

    it("pauses at every stage with every gate set, as before", () => {
        const all: Stage[] = ["discover", "capture", "segment", "cluster", "classify", "plan"];
        for (const stage of all) {
            expect(decideAutoAdvance(job(all), stage).kind).toBe("gate");
        }
    });

    it("stops at the end of the pipeline", () => {
        expect(decideAutoAdvance(job([]), "promote")).toEqual({ kind: "end" });
    });

    it("waits rather than starting a theme-reading stage before the theme is pinned", () => {
        const decision = decideAutoAdvance(
            {
                gateConfig: { stopAfter: [] },
                themeEntryId: "",
                themeExtraction: { status: "running", step: "reading pages", error: null } as never
            },
            "segment"
        );
        expect(decision).toMatchObject({ kind: "waiting", next: "cluster" });
    });

    it("does not wait on the theme for a stage that does not read it", () => {
        expect(
            decideAutoAdvance(
                { gateConfig: { stopAfter: [] }, themeEntryId: "", themeExtraction: null },
                "discover"
            )
        ).toEqual({ kind: "advance", next: "capture" });
    });
});
