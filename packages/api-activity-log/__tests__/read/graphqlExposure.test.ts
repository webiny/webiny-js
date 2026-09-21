import { describe, expect, it, vi } from "vitest";
import { Result } from "@webiny/feature/api";
import type { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions";
import { ActivityLogGraphQL } from "~/graphql/ActivityLogGraphQLFactory.js";
import type { ActivityRecord } from "~/core/types.js";
import type { ListActivityUseCase } from "~/features/listActivity/index.js";

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

    const result = await resolver.resolver(useCase)({
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
                    valuesWrittenOn: "2026-09-10T08:30:00.000Z"
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
