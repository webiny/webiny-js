import { beforeEach, describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { Constructor } from "@webiny/di";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { ResolveAiCapabilityUseCase } from "@webiny/ai-powerups/api/features/Capabilities/index.js";
import { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecord } from "~/core/types.js";
import { SummariseActivityTaskDefinition } from "~/cms/summary/SummariseActivityTaskDefinition.js";

/**
 * The job, and above all its failure paths.
 *
 * Every exit must clear the transient values. If one does not, the sweeper reclaims them eventually
 * and the defect is invisible until someone goes looking — so each of these asserts the bundle is
 * gone, not merely that the job finished. Asserting completion alone is what would let the bug
 * through.
 */

const record = (overrides: Partial<ActivityRecord> = {}): ActivityRecord =>
    ({
        id: "rec-1",
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: "c1",
        changeset: [],
        truncated: false,
        summaryState: {
            values: [
                { path: "hero.heading", label: "Heading", before: "Old", after: "New" },
                // Over MAX_VALUE_CHARS, or the truncation branch is never reached.
                { path: "body", label: "Body", before: "a".repeat(3000), after: "b".repeat(3000) }
            ],
            valuesWrittenOn: "2026-09-10T10:00:00.000Z"
        },
        ...overrides
    }) as ActivityRecord;

interface HarnessOptions {
    stored?: ActivityRecord | null;
    capabilityFails?: boolean;
    generate?: () => Promise<{ text: string }>;
    settleFails?: boolean;
}

const harness = (options: HarnessOptions = {}) => {
    const container = new Container();

    const settleSummary = vi.fn(async (_p: ActivityLogStorage.SettleSummaryParams) =>
        options.settleFails ? Result.fail(new Error("write failed") as never) : Result.ok()
    );

    const list = vi.fn(async (_p: ActivityLogStorage.ListParams) =>
        Result.ok({
            records: options.stored === null ? [] : [options.stored ?? record()],
            cursor: null,
            hasMore: false
        })
    );

    container.registerInstance(ActivityLogStorage, {
        append: vi.fn(),
        list,
        deleteAllForTarget: vi.fn(),
        settleSummary,
        extendSummaryValues: vi.fn(),
        findStaleValues: vi.fn()
    } as unknown as ActivityLogStorage.Interface);

    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async () =>
            options.capabilityFails
                ? Result.fail(new Error("No AI provider configured."))
                : Result.ok({
                      capabilityId: "cms.activityLogSummary",
                      model: "anthropic/claude",
                      connection: { sdkName: "anthropic", apiKey: "k" },
                      roleId: "fast",
                      fellBackToStandard: false,
                      guidance: "g",
                      additionalInstructions: ""
                  } as never)
    } as unknown as ResolveAiCapabilityUseCase.Interface);

    const generateText = vi.fn(
        (options.generate ?? (async () => ({
            text: "Rewrote the hero heading and the body copy."
        }))) as (params: { prompt: string; model: string }) => Promise<{ text: string }>
    );

    container.registerInstance(Ai, { generateText } as unknown as Ai.Interface);
    container.register(SummariseActivityTaskDefinition);

    const definition = container.resolve(TaskDefinition);
    const handlerClass = definition.handler as Constructor<TaskHandler.Interface<never, never>>;

    return {
        handler: container.resolveImplementation(handlerClass),
        settleSummary,
        generateText,
        list
    };
};

const controller = () => {
    const calls = {
        done: vi.fn((message?: string, _output?: unknown) => ({ kind: "done", message })),
        error: vi.fn((error: unknown) => ({ kind: "error", error })),
        aborted: vi.fn(() => ({ kind: "aborted" })),
        continue: vi.fn()
    };

    return {
        calls,
        controller: {
            runtime: { isAborted: () => false, isCloseToTimeout: () => false },
            response: calls
        } as never
    };
};

const input = { recordId: "rec-1", targetId: "abc", revision: "abc#0001" } as never;

/** What every failure path owes: the values are gone. */
const clearedTheBundle = (settleSummary: ReturnType<typeof harness>["settleSummary"]) => {
    expect(settleSummary).toHaveBeenCalledTimes(1);
    // `settleSummary` clears by contract, so calling it at all is the clear. What matters is that
    // the path took it rather than returning early.
    return settleSummary.mock.calls[0]![0];
};

beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("the happy path", () => {
    it("stores the summary and clears the values in one write", async () => {
        const { handler, settleSummary } = harness();
        const { controller: ctrl, calls } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(clearedTheBundle(settleSummary)).toEqual({
            recordId: "rec-1",
            summary: "Rewrote the hero heading and the body copy."
        });
        expect(calls.done).toHaveBeenCalled();
    });

    it("names fields the way the timeline names them", async () => {
        // The reason the prompt builder shares its path derivation with the admin side: a model
        // handed `hero.heading` writes about `hero.heading`.
        const { handler, generateText } = harness();
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(generateText.mock.calls[0]![0].prompt).toContain("Hero › Heading");
    });

    it("does not send an entire long value", async () => {
        const { handler, generateText } = harness();
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(generateText.mock.calls[0]![0].prompt).toContain("truncated");
    });
});

describe("failure paths, each of which owes a cleared bundle", () => {
    it("clears when the capability cannot be resolved", async () => {
        const { handler, settleSummary } = harness({ capabilityFails: true });
        const { controller: ctrl, calls } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(clearedTheBundle(settleSummary)).toMatchObject({ reason: "ai-unavailable" });
        // Done, not error: "no model configured" is not a task failure and should not fill a task
        // list with noise.
        expect(calls.done).toHaveBeenCalled();
        expect(calls.error).not.toHaveBeenCalled();
    });

    it("clears when the model call throws", async () => {
        const { handler, settleSummary } = harness({
            generate: async () => {
                throw new Error("provider timed out");
            }
        });
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(clearedTheBundle(settleSummary)).toMatchObject({ reason: "generation-failed" });
    });

    it("clears when the response is empty", async () => {
        const { handler, settleSummary } = harness({ generate: async () => ({ text: "   " }) });
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(clearedTheBundle(settleSummary)).toMatchObject({ reason: "generation-failed" });
    });

    it("clears when the model writes an essay", async () => {
        // An over-long response stored verbatim would put a wall of content on a timeline row
        // permanently, which is the one thing retention makes irreversible.
        const { handler, settleSummary } = harness({
            generate: async () => ({ text: "x".repeat(5000) })
        });
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(clearedTheBundle(settleSummary)).toMatchObject({ reason: "generation-failed" });
    });

    it("never stores a summary on a path that failed", async () => {
        // Belt and braces across all four: a failure must not write prose.
        for (const options of [
            { capabilityFails: true },
            { generate: async () => ({ text: "" }) },
            { generate: async () => ({ text: "x".repeat(5000) }) }
        ]) {
            const { handler, settleSummary } = harness(options as HarnessOptions);
            const { controller: ctrl } = controller();

            await handler.run({ input, controller: ctrl } as never);

            expect(settleSummary.mock.calls[0]![0].summary).toBeUndefined();
        }
    });
});

describe("when there is nothing to do", () => {
    it("completes without writing when the record is gone", async () => {
        // Trashed and purged, or the revision deleted, while the job waited. Writing would be
        // writing to nothing; settling is a no-op by contract but the call is still pointless.
        const { handler, settleSummary } = harness({ stored: null });
        const { controller: ctrl, calls } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(settleSummary).not.toHaveBeenCalled();
        expect(calls.error).not.toHaveBeenCalled();
        // Asserted on the message, not merely on completion. The next guard — values already gone
        // — also completes without writing, so a test that checked only `done` would pass with
        // this guard removed, which is exactly what it did before this line was added.
        expect(calls.done.mock.calls[0]![0]).toContain("no longer exists");
    });

    it("completes without writing when the values are already gone", async () => {
        // Already settled by an earlier run of this same task, or reclaimed by the sweeper.
        // Writing here would overwrite a result that is not ours.
        const { handler, settleSummary, generateText } = harness({
            stored: record({ summaryState: { reason: "abandoned" } })
        });
        const { controller: ctrl, calls } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(generateText).not.toHaveBeenCalled();
        expect(settleSummary).not.toHaveBeenCalled();
        expect(calls.done.mock.calls[0]![0]).toContain("No values to summarise");
    });

    it("does not call the model when the record is gone", async () => {
        // The expensive half must not run for a record that no longer exists.
        const { handler, generateText } = harness({ stored: null });
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(generateText).not.toHaveBeenCalled();
    });
});

describe("a job beaten by a later save", () => {
    it("summarises the run as it stood, rather than corrupting anything", async () => {
        // The race the design accepts: a later save extended the bundle after this job read it.
        // The summary then covers part of the run and the remaining saves keep their deterministic
        // descriptions. Nothing is wrong, only shorter.
        const { handler, settleSummary, generateText } = harness({
            stored: record({
                summaryState: {
                    values: [{ path: "body", label: "Body", before: "old", after: "new" }],
                    valuesWrittenOn: "2026-09-10T10:00:00.000Z"
                }
            })
        });
        const { controller: ctrl } = controller();

        await handler.run({ input, controller: ctrl } as never);

        // It summarised what it read, and it cleared what it read.
        expect(generateText.mock.calls[0]![0].prompt).toContain("Body");
        expect(clearedTheBundle(settleSummary)).toMatchObject({ recordId: "rec-1" });
    });
});

describe("when the write itself fails", () => {
    it("reports an error, because the values are still there", async () => {
        // The one failure worth surfacing: the summary exists and the bundle does not. The sweeper
        // reclaims it, but the task should not claim success.
        const { handler } = harness({ settleFails: true });
        const { controller: ctrl, calls } = controller();

        await handler.run({ input, controller: ctrl } as never);

        expect(calls.error).toHaveBeenCalled();
        expect(calls.done).not.toHaveBeenCalled();
    });
});

describe("the definition", () => {
    it("runs once and cleans up after itself", async () => {
        const container = new Container();
        container.register(SummariseActivityTaskDefinition);
        const definition = container.resolve(TaskDefinition);

        expect(definition).toMatchObject({
            id: "activityLogSummariseSave",
            isPrivate: true,
            databaseLogs: false,
            maxIterations: 1,
            selfCleanup: "always"
        });
    });
});
