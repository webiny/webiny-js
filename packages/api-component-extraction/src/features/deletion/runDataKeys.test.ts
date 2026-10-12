import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import type { StageLedgerEntry } from "~/domain/types.js";
import { generateResultKey } from "~/features/stages/generate/componentGeneration.js";
import { generationLogKey } from "~/features/stages/generate/generationLog.js";
import { runLedgerKey, stageArtifactKey } from "~/constants.js";
import { runDataKeys } from "./runDataKeys.js";

/* A real run whose stages were re-run 59 times between them: plan to v11, generate to v13. */
const fixture = JSON.parse(
    readFileSync(join(__dirname, "__fixtures__", "freehill-run-ledger-2026-10-12.json"), "utf8")
) as { runId: string; stages: StageLedgerEntry[]; signatures: string[] };

const keys = new Set(runDataKeys(fixture));

describe("the key-value records a run leaves", () => {
    it("includes every key the ledger names", () => {
        for (const entry of fixture.stages) {
            for (const key of Object.values(entry.artifacts)) {
                expect(keys.has(key)).toBe(true);
            }
        }
        expect(keys.has(runLedgerKey(fixture.runId))).toBe(true);
    });

    it("includes the earlier versions the ledger no longer names", () => {
        expect(keys.has(stageArtifactKey(fixture.runId, "plan", 1, "plan"))).toBe(true);
        expect(keys.has(stageArtifactKey(fixture.runId, "promote", 4, "promotion"))).toBe(true);
        expect(keys.has(stageArtifactKey(fixture.runId, "plan", 3, "plan.machine"))).toBe(true);
        // Never past the current version.
        expect(keys.has(stageArtifactKey(fixture.runId, "plan", 12, "plan"))).toBe(false);
    });

    it("includes each component's Generate results at every version, and its generation log", () => {
        for (const signature of fixture.signatures) {
            for (let version = 1; version <= 13; version++) {
                expect(keys.has(generateResultKey(fixture.runId, version, signature))).toBe(true);
            }
            expect(keys.has(generationLogKey(fixture.runId, signature))).toBe(true);
        }
    });

    it("names only this run's records", () => {
        for (const key of keys) {
            expect(key).toContain(fixture.runId.split("#")[0]);
        }
    });
});
