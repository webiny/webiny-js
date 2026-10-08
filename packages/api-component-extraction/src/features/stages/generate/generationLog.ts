import { createHash, randomUUID } from "node:crypto";
import { Result } from "@webiny/feature/api";
import type { GenerationTrace } from "@webiny/remote-components/api/features/generateComponent/abstractions.js";
import type { ExtractionError } from "~/domain/errors.js";
import type { BlobStore, StageArtifactStore } from "~/domain/stage.js";

/**
 * Every generation attempt of a component, as sent and as answered: model, tokens, duration, outcome,
 * and the whole prompt.
 *
 * A component that keeps failing could not be diagnosed: the artifact keeps only the best attempt's
 * validation, and a call cut off at its time limit leaves no output and no usage. The log keeps each
 * attempt — of the stage and of "generate again" — so the operator can read what was asked and what
 * came back, attempt by attempt.
 *
 * The index is small and lives in the run's store; each prompt is a blob, read only when the operator
 * opens that attempt. Kept across Generate versions, newest last, capped.
 */

/** Past this the oldest attempts are dropped from the index; their prompt blobs stay. */
const MAX_ENTRIES = 60;
/** Enough failures to see the pattern; the full list is the prompt of the next attempt. */
const MAX_FAILURES = 20;

export type GenerationTrigger = "generate" | "generate-again" | "refine" | "experiment";

export interface GenerationLogEntry {
    id: string;
    recordedOn: string;
    stageVersion: number;
    trigger: GenerationTrigger;
    attempt: number;
    maxAttempts: number;
    model: string;
    durationMs: number;
    usage?: GenerationTrace["usage"];
    finishReason?: string;
    outputChars?: number;
    /** `passed`: every check green. `failed-checks`: an answer that failed validation. `call-failed`: no answer. */
    outcome: "passed" | "failed-checks" | "call-failed";
    error?: string;
    failures: string[];
    promptRef: string;
    /** Set on a prompt experiment's attempts: its label and the prompt lines it left out. */
    experiment?: { label: string; ablate: string[] };
}

export interface GenerationLog {
    signature: string;
    entries: GenerationLogEntry[];
}

export interface GenerationPrompt {
    system: string;
    user: string;
    imageFileIds: string[];
    /** The image parts the request actually carried. Absent on entries written before it was recorded. */
    imagesAttached?: { mediaType: string; bytes: number }[];
    /** What the attempt answered, as parsed. Absent where there was no answer, and on older entries. */
    output?: { source: string; css: string };
}

/** One attempt as the attempt loop reports it. */
export interface AttemptRecord {
    attempt: number;
    maxAttempts: number;
    trace: GenerationTrace | null;
    outcome: GenerationLogEntry["outcome"];
    failures: string[];
    output?: { source: string; css: string };
}

const signatureHash = (signature: string): string =>
    createHash("sha1").update(signature).digest("hex");

/** Not keyed by Generate version: the log spans them, each entry saying which it belongs to. */
export const generationLogKey = (runId: string, signature: string): string =>
    `componentExtraction:generationLog:${runId}:${signatureHash(signature)}`;

export const appendGenerationLog = async (
    store: StageArtifactStore.Interface,
    blobs: BlobStore.Interface,
    input: {
        runId: string;
        signature: string;
        stageVersion: number;
        trigger: GenerationTrigger;
        record: AttemptRecord;
        experiment?: GenerationLogEntry["experiment"];
    }
): Promise<Result<GenerationLogEntry, ExtractionError>> => {
    const id = randomUUID();
    const trace = input.record.trace;
    const prompt: GenerationPrompt = {
        system: trace?.system ?? "",
        user: trace?.user ?? "",
        imageFileIds: trace?.imageFileIds ?? [],
        imagesAttached: trace?.imagesAttached ?? [],
        ...(input.record.output ? { output: input.record.output } : {})
    };
    const stored = await blobs.put(
        `${input.runId}/generation-log/${signatureHash(input.signature)}/${id}.json`,
        new TextEncoder().encode(JSON.stringify(prompt)),
        "application/json"
    );
    if (stored.isFail()) {
        return Result.fail(stored.error);
    }

    const entry: GenerationLogEntry = {
        id,
        recordedOn: new Date().toISOString(),
        stageVersion: input.stageVersion,
        trigger: input.trigger,
        attempt: input.record.attempt,
        maxAttempts: input.record.maxAttempts,
        model: trace?.model ?? "",
        durationMs: trace?.durationMs ?? 0,
        ...(trace?.usage ? { usage: trace.usage } : {}),
        ...(trace?.finishReason ? { finishReason: trace.finishReason } : {}),
        ...(trace?.outputChars !== undefined ? { outputChars: trace.outputChars } : {}),
        outcome: input.record.outcome,
        ...(trace?.error ? { error: trace.error } : {}),
        failures: input.record.failures.slice(0, MAX_FAILURES),
        promptRef: stored.value,
        ...(input.experiment ? { experiment: input.experiment } : {})
    };

    const key = generationLogKey(input.runId, input.signature);
    const existing = await store.getJson<GenerationLog>(key);
    if (existing.isFail()) {
        return Result.fail(existing.error);
    }
    const entries = [...(existing.value?.entries ?? []), entry].slice(-MAX_ENTRIES);
    const written = await store.putJson(key, { signature: input.signature, entries });
    if (written.isFail()) {
        return Result.fail(written.error);
    }
    return Result.ok(entry);
};

export const readGenerationLog = async (
    store: StageArtifactStore.Interface,
    runId: string,
    signature: string
): Promise<Result<GenerationLog, ExtractionError>> => {
    const log = await store.getJson<GenerationLog>(generationLogKey(runId, signature));
    if (log.isFail()) {
        return Result.fail(log.error);
    }
    return Result.ok(log.value ?? { signature, entries: [] });
};

export const readGenerationPrompt = async (
    store: StageArtifactStore.Interface,
    blobs: BlobStore.Interface,
    input: { runId: string; signature: string; entryId: string }
): Promise<Result<GenerationPrompt | null, ExtractionError>> => {
    const log = await readGenerationLog(store, input.runId, input.signature);
    if (log.isFail()) {
        return Result.fail(log.error);
    }
    // Only a ref the log itself holds is read: the id is the operator's, the ref is ours.
    const entry = log.value.entries.find(item => item.id === input.entryId);
    if (!entry) {
        return Result.ok(null);
    }
    const bytes = await blobs.get(entry.promptRef);
    if (bytes.isFail()) {
        return Result.fail(bytes.error);
    }
    return Result.ok(JSON.parse(new TextDecoder().decode(bytes.value)) as GenerationPrompt);
};
