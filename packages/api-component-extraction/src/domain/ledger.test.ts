import { describe, expect, it } from "vitest";
import {
    initLedger,
    markStageDone,
    markStageFailed,
    markStageRunning,
    markStaleFrom,
    mergeLedgers,
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

describe("mergeLedgers — drops only regressions", () => {
    it("keeps a running stage when a stale writer's ledger still has it pending", () => {
        // stored: discover done, capture running (started, not yet done).
        const stored = markStageRunning(
            markStageDone(initLedger(), "discover", { urls: "k" }, NOW),
            "capture",
            NOW
        );
        // A stale writer holds the pre-capture snapshot (capture still pending) and re-writes it.
        const stale = markStageDone(initLedger(), "discover", { urls: "k" }, NOW);
        const merged = mergeLedgers(stored, stale);
        // Capture must not be knocked back to pending.
        expect(stageEntry(merged, "capture")?.status).toBe("running");
    });

    it("keeps a done stage against a stale pending write", () => {
        const stored = markStageDone(initLedger(), "capture", { tree: "k" }, NOW);
        const stale = initLedger(); // capture pending
        const merged = mergeLedgers(stored, stale);
        expect(stageEntry(merged, "capture")?.status).toBe("done");
    });

    it("keeps a re-run of a stale stage (running/done wins over the stored stale)", () => {
        let stored = markStageDone(initLedger(), "capture", { tree: "k" }, NOW);
        stored = markStageDone(stored, "segment", { boxes: "b" }, NOW);
        stored = markStaleFrom(stored, "segment"); // segment stale, v1
        // The segment re-run's markStageDone (segment done, v2) must win over the stored stale.
        const incoming = markStageDone(stored, "segment", { boxes: "b2" }, NOW);
        const merged = mergeLedgers(stored, incoming);
        expect(stageEntry(merged, "segment")?.status).toBe("done");
        expect(stageEntry(merged, "segment")?.stageVersion).toBe(2);
    });

    it("drops a stale writer whose stage version is behind", () => {
        let stored = markStageDone(initLedger(), "segment", { boxes: "b1" }, NOW);
        stored = markStageDone(stored, "segment", { boxes: "b2" }, NOW); // segment done v2
        const staleAtV1 = stored.map(entry =>
            entry.stage === "segment"
                ? { ...entry, status: "stale" as const, stageVersion: 1 }
                : entry
        );
        const merged = mergeLedgers(stored, staleAtV1);
        expect(stageEntry(merged, "segment")?.status).toBe("done");
        expect(stageEntry(merged, "segment")?.stageVersion).toBe(2);
    });
});
