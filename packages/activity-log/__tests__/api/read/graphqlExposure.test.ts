import { describe, expect, it, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import type { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions";
import { ActivityLogGraphQL } from "~/api/graphql/ActivityLogGraphQLFactory.js";
import type { ActivityRecord } from "~/api/core/types.js";
import type { ListActivityUseCase } from "~/api/features/listActivity/index.js";
import { DEFAULT_ACTIVITY_SUMMARY_CONFIG } from "~/api/cms/summary/config.js";

/**
 * What the API offers a client, and — more importantly — what it does not.
 *
 * The record carries content values for as long as a job needs them. This is the boundary that
 * decides they never leave the server, so the schema is asserted against directly rather than
 * inferred from a resolver that happens not to map them today.
 */

const record = (overrides: Partial<ActivityRecord> = {}): ActivityRecord => ({
    id: "rec-1",
    targetType: "cms-entry",
    targetId: "abc",
    revision: "abc#0003",
    timestamp: "2026-09-10T08:30:00.000Z",
    actor: { id: "u-1", type: "admin", displayName: "Ada" },
    action: "entry.update",
    source: "admin",
    correlationId: "corr00000001",
    changeset: [{ path: "title", label: "Title" }],
    truncated: false,
    ...overrides
});

interface CapturedResolver {
    path: string;
    resolver: (
        useCase: ListActivityUseCase.Interface
    ) => (params: {
        args: Record<string, unknown>;
    }) => Promise<{ data?: unknown[] | null; error?: unknown }>;
}

const build = () => {
    let typeDefs = "";
    let captured: CapturedResolver | null = null;

    const builder = {
        addTypeDefs: (defs: string) => {
            typeDefs += defs;
        },
        addResolver: (config: CapturedResolver) => {
            captured = config;
        }
    } as unknown as GraphQLSchemaBuilder.Interface;

    return { builder, typeDefs: () => typeDefs, resolver: () => captured! };
};

const schema = async () => {
    const { builder, typeDefs, resolver } = build();
    await new ActivityLogGraphQL().execute(builder);
    return { typeDefs: typeDefs(), resolver: resolver() };
};

/** Runs the registered resolver against a use case that returns exactly these records. */
const query = async (records: ActivityRecord[]) => {
    const { resolver } = await schema();

    const useCase = {
        execute: vi.fn(async () => Result.ok({ records, cursor: null, hasMore: false }))
    } as unknown as ListActivityUseCase.Interface;

    const result = await resolver.resolver(
        useCase,
        DEFAULT_ACTIVITY_SUMMARY_CONFIG
    )({
        args: { targetType: "cms-entry", targetId: "abc", modelId: "article" }
    });

    return (result.data ?? []) as Record<string, unknown>[];
};

describe("the schema", () => {
    it("offers the summary and whether one is coming", async () => {
        const { typeDefs } = await schema();

        expect(typeDefs).toContain("summary: String");
        expect(typeDefs).toContain("summaryPending: Boolean!");
    });

    it("offers the run a record belongs to, and never null", async () => {
        // Non-null because every record has exactly one run. A nullable field here would push the
        // fallback into every client, and a client that got it wrong would group the unsummarised
        // majority — nearly the whole timeline — into one run.
        const { typeDefs } = await schema();

        expect(typeDefs).toContain("summaryRunId: ID!");
    });

    it.each([
        ["summaryState", "the whole job-state object"],
        ["summaryValues", "the stored field"],
        ["valuesWrittenOn", "when the values were written"],
        ["summaryTaskId", "the dispatched task"]
    ])("never exposes %s — %s", async name => {
        // Content values live on the record only until the job consumes them. Nothing about that
        // arrangement is a client's business, and an accidental field here would publish the very
        // thing the design keeps off the wire.
        const { typeDefs } = await schema();

        expect(typeDefs).not.toContain(name);
    });

    it("says in the schema that a summary may quote content", async () => {
        // The changeset never carries values and says so. A summary is the exception, and a client
        // author reading this schema needs to know the difference.
        const { typeDefs } = await schema();

        expect(typeDefs).toContain("may quote content");
    });
});

describe("what a record looks like on the wire", () => {
    it("carries a settled summary", async () => {
        const [row] = await query([record({ summary: "Rewrote the hero heading." })]);

        expect(row).toMatchObject({
            summary: "Rewrote the hero heading.",
            summaryPending: false
        });
    });

    it("reports pending while a job is in flight", async () => {
        const [row] = await query([
            record({
                summaryState: {
                    values: [{ path: "body", label: "Body", before: "a", after: "b" }],
                    valuesWrittenOn: new Date().toISOString()
                }
            })
        ]);

        expect(row).toMatchObject({ summary: null, summaryPending: true });
    });

    it("does not report pending once a record has settled without one", async () => {
        // A record skipped for any reason is settled, not waiting. A client showing a spinner here
        // would show it forever.
        const [row] = await query([record({ summaryState: { reason: "too-few-text-fields" } })]);

        expect(row).toMatchObject({ summary: null, summaryPending: false });
    });

    it("does not report pending for the overwhelming majority, which have no state at all", async () => {
        const [row] = await query([record()]);

        expect(row).toMatchObject({ summary: null, summaryPending: false });
    });

    it("does not put the values on the wire even when the record carries them", async () => {
        const [row] = await query([
            record({
                summaryState: {
                    values: [
                        { path: "body", label: "Body", before: "secret", after: "also secret" }
                    ],
                    valuesWrittenOn: "2026-09-10T08:30:00.000Z"
                }
            })
        ]);

        expect(JSON.stringify(row)).not.toContain("secret");
        expect(row).not.toHaveProperty("summaryState");
    });
});

describe("a summary that is never coming", () => {
    const withValues = (writtenOn: string) =>
        record({
            summaryState: {
                values: [{ path: "body", label: "Body", before: "a", after: "b" }],
                valuesWrittenOn: writtenOn
            }
        });

    it("stops claiming one is on the way once the wait is too long", async () => {
        // A job can fail to run at all — a Lambda timeout, or a task created whose execution never
        // starts — and nothing schedules the sweep that reclaims it. Without an expiry the row says
        // "Summarising…" forever, on every visit, surviving every reload.
        const old = new Date(
            Date.now() - DEFAULT_ACTIVITY_SUMMARY_CONFIG.pendingGraceMs - 1000
        ).toISOString();

        const [row] = await query([withValues(old)]);

        expect(row).toMatchObject({ summaryPending: false, summary: null });
    });

    it("still claims one while the wait is reasonable", async () => {
        const recent = new Date(Date.now() - 30_000).toISOString();

        const [row] = await query([withValues(recent)]);

        expect(row!.summaryPending).toBe(true);
    });

    it("does not claim one for values it cannot age", async () => {
        // Claiming freshness for a value with no timestamp is the claim that sticks forever.
        const [row] = await query([
            record({
                summaryState: { values: [{ path: "body", label: "Body", before: "a", after: "b" }] }
            })
        ]);

        expect(row!.summaryPending).toBe(false);
    });
});

describe("which run a record belongs to", () => {
    it("carries the run it joined", async () => {
        const [row] = await query([
            record({
                id: "rec-2",
                summaryRunId: "rec-1",
                summaryState: { reason: "covered-by-run" }
            })
        ]);

        expect(row!.summaryRunId).toBe("rec-1");
    });

    it("carries its own id when it joined nothing", async () => {
        // The unsummarised majority. Resolving here rather than in a client is what lets grouping
        // be one rule instead of a rule plus a fallback.
        const [row] = await query([record({ id: "rec-9" })]);

        expect(row!.summaryRunId).toBe("rec-9");
    });

    it("carries its own id once a refused join has been withdrawn", async () => {
        const [row] = await query([
            record({ id: "rec-3", summaryState: { reason: "join-refused" } })
        ]);

        expect(row!.summaryRunId).toBe("rec-3");
    });
});
