import { runLedgerKey, runReattachmentsKey, stageArtifactKey } from "~/constants.js";
import type { StageLedgerEntry } from "~/domain/types.js";
import { generateResultKey } from "~/features/stages/generate/componentGeneration.js";
import { generationLogKey } from "~/features/stages/generate/generationLog.js";

/**
 * Every artifact name a stage writes under its own key, beside the ones its ledger entry names.
 *
 * The ledger records only the current version's artifacts, and the key-value store cannot be listed
 * by prefix (one partition per key), so an earlier version's records can only be found by rebuilding
 * their keys. The names are fixed per stage; the only computed ones are Generate's per-component
 * results, which take the plan's signatures.
 */
const FIXED_NAMES = [
    "urls",
    "pages",
    "sections",
    "clusters",
    "classifications",
    "plan",
    "components",
    "assembly",
    "promotion",
    "checkpoint",
    "coordinator",
    "renders",
    "render-checkpoint"
];

/** The artifacts a correction can override: each also has its machine and effective copies. */
const OVERRIDABLE = ["urls", "pages", "sections", "clusters", "classifications", "plan"];

const NAMES = [
    ...FIXED_NAMES,
    ...OVERRIDABLE.flatMap(name => [`${name}.machine`, `${name}.effective`])
];

/** The name part of an artifact key: what follows `:v{version}:`. */
const nameOf = (key: string): string | null => {
    const match = /:v\d+:(.+)$/.exec(key);
    return match ? match[1]! : null;
};

/**
 * Every key-value key a run can have written: each stage's artifacts at every version up to its
 * current one, Generate's per-component results and generation logs for every signature its plans
 * named, the ledger and the reattachment record.
 *
 * Over-inclusive on purpose. Deleting a key that was never written does nothing, and a key this
 * misses stays in storage with nothing able to find it.
 */
export const runDataKeys = (params: {
    runId: string;
    stages: StageLedgerEntry[];
    /** Every signature any version of the run's plan named. */
    signatures: string[];
}): string[] => {
    const keys = new Set<string>();
    for (const entry of params.stages) {
        const names = new Set(NAMES);
        for (const key of Object.values(entry.artifacts ?? {})) {
            keys.add(key);
            const name = nameOf(key);
            if (name) {
                names.add(name);
            }
        }
        for (let version = 1; version <= entry.stageVersion; version++) {
            for (const name of names) {
                keys.add(stageArtifactKey(params.runId, entry.stage, version, name));
            }
            if (entry.stage === "generate") {
                for (const signature of params.signatures) {
                    keys.add(generateResultKey(params.runId, version, signature));
                }
            }
        }
    }
    for (const signature of params.signatures) {
        keys.add(generationLogKey(params.runId, signature));
    }
    keys.add(runLedgerKey(params.runId));
    keys.add(runReattachmentsKey(params.runId));
    return [...keys];
};
