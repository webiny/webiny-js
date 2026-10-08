import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import type { BlobStore, StageArtifactStore } from "~/domain/stage.js";
import {
    appendGenerationLog,
    readGenerationLog,
    readGenerationPrompt,
    type AttemptRecord
} from "./generationLog.js";

const stores = () => {
    const data = new Map<string, unknown>();
    const blobData = new Map<string, Uint8Array>();
    const store = {
        getJson: async (key: string) => Result.ok(data.get(key) ?? null),
        putJson: async (key: string, value: unknown) => {
            data.set(key, value);
            return Result.ok(undefined);
        }
    } as unknown as StageArtifactStore.Interface;
    const blobs = {
        put: async (key: string, bytes: Uint8Array) => {
            blobData.set(`prefix/${key}`, bytes);
            return Result.ok(`prefix/${key}`);
        },
        get: async (ref: string) =>
            blobData.has(ref)
                ? Result.ok(blobData.get(ref)!)
                : Result.fail(new Error("missing") as never)
    } as unknown as BlobStore.Interface;
    return { store, blobs };
};

// Freehill's Amenities List: an attempt cut off at the per-call limit, and one that failed its checks.
const cutOff: AttemptRecord = {
    attempt: 1,
    maxAttempts: 3,
    trace: {
        model: "anthropic/claude-sonnet-5",
        effort: "medium",
        system: "You are a React component generator…",
        user: 'Build a "list" website section component named "Amenities List".',
        imageFileIds: ["file-1"],
        imagesAttached: [{ mediaType: "image/png", bytes: 412_000 }],
        durationMs: 300_000,
        error: "The operation was aborted due to timeout"
    },
    outcome: "call-failed",
    failures: ["The operation was aborted due to timeout"]
};
const failedChecks: AttemptRecord = {
    attempt: 2,
    maxAttempts: 3,
    trace: {
        model: "anthropic/claude-sonnet-5",
        effort: null,
        system: "You are a React component generator…",
        user: "…Your previous attempt was rejected…",
        imageFileIds: ["file-1"],
        imagesAttached: [{ mediaType: "image/png", bytes: 412_000 }],
        durationMs: 160_000,
        usage: {
            inputTokens: 20149,
            outputTokens: 17280,
            cacheReadTokens: 0,
            cacheWriteTokens: 15366
        },
        finishReason: "stop",
        outputChars: 61000
    },
    outcome: "failed-checks",
    failures: ['text not on the source page: "Dive In"']
};

describe("generationLog", () => {
    it("keeps every attempt in order, with what it cost and how it ended", async () => {
        const { store, blobs } = stores();
        for (const record of [cutOff, failedChecks]) {
            await appendGenerationLog(store, blobs, {
                runId: "run#0001",
                signature: "amenities",
                stageVersion: 1,
                trigger: "generate-again",
                record
            });
        }
        const log = await readGenerationLog(store, "run#0001", "amenities");
        const entries = log.isOk() ? log.value.entries : [];
        expect(entries.map(entry => [entry.attempt, entry.outcome, entry.durationMs])).toEqual([
            [1, "call-failed", 300_000],
            [2, "failed-checks", 160_000]
        ]);
        expect(entries[0]).not.toHaveProperty("usage");
        expect(entries[1].usage?.outputTokens).toBe(17280);
        // Recorded on every call, so a slow or costly run can be read for the effort it used.
        expect(entries.map(entry => entry.effort)).toEqual(["medium", null]);
        expect(entries[1].failures).toEqual(['text not on the source page: "Dive In"']);
    });

    it("returns an attempt's whole prompt, read through the log's own reference", async () => {
        const { store, blobs } = stores();
        const appended = await appendGenerationLog(store, blobs, {
            runId: "run#0001",
            signature: "amenities",
            stageVersion: 1,
            trigger: "generate",
            record: failedChecks
        });
        const entryId = appended.isOk() ? appended.value.id : "";
        const prompt = await readGenerationPrompt(store, blobs, {
            runId: "run#0001",
            signature: "amenities",
            entryId
        });
        expect(prompt.isOk() && prompt.value).toEqual({
            system: "You are a React component generator…",
            user: "…Your previous attempt was rejected…",
            imageFileIds: ["file-1"],
            imagesAttached: [{ mediaType: "image/png", bytes: 412_000 }]
        });
        const unknown = await readGenerationPrompt(store, blobs, {
            runId: "run#0001",
            signature: "amenities",
            entryId: "not-in-the-log"
        });
        expect(unknown.isOk() && unknown.value).toBeNull();
    });
});
