import { describe, expect, it } from "vitest";
import {
    initLedger,
    markStageDone,
    markStageFailed,
    markStageRunning,
    stageEntry
} from "./ledger.js";
import { STAGES } from "~/constants.js";

const NOW = "2026-01-01T00:00:00.000Z";

describe("initLedger", () => {
    it("creates one pending, version-0 entry per stage, in order", () => {
        const ledger = initLedger();
        expect(ledger.map(e => e.stage)).toEqual([...STAGES]);
        expect(ledger.every(e => e.status === "pending" && e.stageVersion === 0)).toBe(true);
        expect(ledger.every(e => Object.keys(e.artifacts).length === 0)).toBe(true);
    });
});

describe("markStageDone — staleness cascade", () => {
    it("bumps the stage version and records artifacts", () => {
        const ledger = markStageDone(initLedger(), "capture", { tree: "s3://key" }, NOW);
        const capture = stageEntry(ledger, "capture")!;
        expect(capture.status).toBe("done");
        expect(capture.stageVersion).toBe(1);
        expect(capture.artifacts).toEqual({ tree: "s3://key" });
        expect(capture.finishedOn).toBe(NOW);
    });

    it("marks downstream stages that had output stale, but leaves pending ones pending", () => {
        // segment is done (has output); classify is still pending.
        let ledger = markStageDone(initLedger(), "segment", { boxes: "k1" }, NOW);
        // Re-run capture (upstream of both): segment must go stale, classify stays pending.
        ledger = markStageDone(ledger, "capture", { tree: "k2" }, NOW);

        expect(stageEntry(ledger, "segment")!.status).toBe("stale");
        expect(stageEntry(ledger, "classify")!.status).toBe("pending");
        // Upstream of capture (discover) is untouched.
        expect(stageEntry(ledger, "discover")!.status).toBe("pending");
    });

    it("does not touch the stage's own downstream on a first run when nothing downstream has output", () => {
        const ledger = markStageDone(initLedger(), "discover", { urls: "k" }, NOW);
        expect(ledger.filter(e => e.status === "stale")).toHaveLength(0);
    });
});

describe("markStageFailed", () => {
    it("marks failed with the error and does not bump version or cascade", () => {
        let ledger = markStageDone(initLedger(), "capture", { tree: "k" }, NOW);
        ledger = markStageRunning(ledger, "segment", NOW);
        ledger = markStageFailed(ledger, "segment", "boom", NOW);

        const segment = stageEntry(ledger, "segment")!;
        expect(segment.status).toBe("failed");
        expect(segment.error).toBe("boom");
        // Capture (upstream) is untouched; nothing downstream of segment went stale.
        expect(stageEntry(ledger, "capture")!.stageVersion).toBe(1);
        expect(ledger.filter(e => e.status === "stale")).toHaveLength(0);
    });
});
