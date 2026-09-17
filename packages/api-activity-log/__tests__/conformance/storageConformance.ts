import { describe, expect, it } from "vitest";
import type { Result } from "@webiny/feature/api";
import type { ActivityLogStorage } from "~/core/abstractions.js";
import type { ActivityRecordInput } from "~/core/types.js";

/**
 * The contract every `ActivityLogStorage` implementation must satisfy.
 *
 * Written against the interface and nothing else. It knows about `append`, `list` and
 * `deleteAllForTarget`, and about no CMS concept whatsoever — no models, no entries, no cursors it
 * can read. The private-model adapter runs it today; the lighter store runs the same file
 * unchanged when it arrives, so the replacement is verified rather than assumed.
 *
 * Two rules keep it honest as a portability check:
 *
 *   - **Never inspect a cursor.** It is an opaque string, minted by the implementation in whatever
 *     format suits it. A test that parses one would pass only for the store that produced it.
 *   - **Never assume a write is visible before `append` resolves**, or that two records written in
 *     the same millisecond have any particular order beyond what the implementation reports.
 */

export interface StorageUnderTest {
    /** A fresh storage instance, plus a target id nothing else in the suite uses. */
    run<T>(callback: (storage: ActivityLogStorage.Interface) => Promise<T>): Promise<T>;
}

/**
 * Unwraps a Result, failing loudly with the underlying error.
 *
 * A conformance suite must never let a failed call look like an empty one: `records.length === 0`
 * and "the query blew up" are different findings and only one of them is a bug in the caller.
 */
const unwrap = <T, E>(result: Result<T, E>, what: string): T => {
    if (result.isFail()) {
        throw new Error(`${what} failed: ${String(result.error)}`);
    }

    return result.value;
};

let targetCounter = 0;

const nextTargetId = (prefix: string): string => {
    targetCounter++;
    return `${prefix}-${targetCounter}-${Date.now().toString(36)}`;
};

const recordFor = (
    targetId: string,
    overrides: Partial<ActivityRecordInput> = {}
): ActivityRecordInput => ({
    targetType: "cms-entry",
    targetId,
    revision: `${targetId}#0001`,
    timestamp: new Date().toISOString(),
    actor: { id: "editor-1", type: "admin", displayName: "Ada Editor" },
    action: "entry.update",
    source: "admin",
    correlationId: "corr00000001",
    changeset: [],
    truncated: false,
    ...overrides
});

export const describeStorageConformance = (name: string, subject: StorageUnderTest): void => {
    describe(`ActivityLogStorage conformance: ${name}`, () => {
        describe("append", () => {
            it("returns the stored record with an id", async () => {
                const targetId = nextTargetId("append");

                const record = await subject.run(async storage => {
                    const result = await storage.append(recordFor(targetId));
                    expect(result.isOk()).toBe(true);
                    return result.isOk() ? result.value : null;
                });

                expect(record).toMatchObject({ targetId, action: "entry.update" });
                expect(record!.id).toBeTruthy();
            });

            it("round-trips every field of the record shape", async () => {
                const targetId = nextTargetId("roundtrip");
                const input = recordFor(targetId, {
                    revision: `${targetId}#0004`,
                    action: "entry.publish",
                    source: "task:someTask",
                    correlationId: "corrxyz12345",
                    actor: { id: "u-9", type: "api-key", displayName: "Deploy Key" },
                    changeset: [
                        { path: "title", label: "Title" },
                        { path: "sections#aaaa", label: "Sections", operation: "added" }
                    ],
                    truncated: true
                });

                const stored = await subject.run(async storage => {
                    await storage.append(input);
                    const page = await storage.list({
                        target: { type: "cms-entry", id: targetId }
                    });
                    return page.isOk() ? page.value.records[0] : null;
                });

                expect(stored).toMatchObject({
                    targetType: input.targetType,
                    targetId: input.targetId,
                    revision: input.revision,
                    action: input.action,
                    source: input.source,
                    correlationId: input.correlationId,
                    actor: input.actor,
                    changeset: input.changeset,
                    truncated: true
                });
            });
        });

        describe("ordering", () => {
            it("returns records newest first", async () => {
                const targetId = nextTargetId("order");

                const actions = await subject.run(async storage => {
                    for (const revision of ["0001", "0002", "0003"]) {
                        await storage.append(
                            recordFor(targetId, { revision: `${targetId}#${revision}` })
                        );
                    }

                    const page = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return page.records.map(r => r.revision);
                });

                expect(actions).toEqual([
                    `${targetId}#0003`,
                    `${targetId}#0002`,
                    `${targetId}#0001`
                ]);
            });

            it("orders records written inside the same millisecond deterministically", async () => {
                // Not that any particular order is correct — only that paging cannot lose or
                // duplicate a record because two share a timestamp, which a bulk action guarantees.
                const targetId = nextTargetId("sametick");
                const timestamp = new Date().toISOString();

                const seen = await subject.run(async storage => {
                    for (let i = 0; i < 6; i++) {
                        await storage.append(
                            recordFor(targetId, { timestamp, revision: `${targetId}#000${i}` })
                        );
                    }

                    const first = unwrap(
                        await storage.list({
                            target: { type: "cms-entry", id: targetId },
                            limit: 3
                        }),
                        "list page 1"
                    );

                    const second = unwrap(
                        await storage.list({
                            target: { type: "cms-entry", id: targetId },
                            limit: 3,
                            cursor: first.cursor
                        }),
                        "list page 2"
                    );

                    return [
                        ...first.records.map(r => r.revision),
                        ...second.records.map(r => r.revision)
                    ];
                });

                expect(seen).toHaveLength(6);
                expect(new Set(seen).size).toBe(6);
            });
        });

        describe("cursor", () => {
            it("pages through every record exactly once", async () => {
                const targetId = nextTargetId("paging");

                const seen = await subject.run(async storage => {
                    for (let i = 0; i < 7; i++) {
                        await storage.append(
                            recordFor(targetId, { revision: `${targetId}#000${i}` })
                        );
                    }

                    const collected: string[] = [];
                    let cursor: string | null = null;
                    let guard = 0;

                    do {
                        // Annotated rather than inferred: `cursor` is narrowed inside the loop by
                        // the assignment below, which depends on this call, and TypeScript reads
                        // that as circular and falls back to `any`.
                        const page: ActivityLogStorage.ListResult = unwrap(
                            await storage.list({
                                target: { type: "cms-entry", id: targetId },
                                limit: 3,
                                cursor
                            }),
                            `list page ${guard + 1}`
                        );

                        collected.push(...page.records.map(r => r.revision));
                        cursor = page.cursor;
                        guard++;
                    } while (cursor && guard < 10);

                    return collected;
                });

                expect(seen).toHaveLength(7);
                expect(new Set(seen).size).toBe(7);
            });

            it("stops handing out a cursor once the target is exhausted", async () => {
                // Otherwise a caller following the cursor pages forever past the end.
                const targetId = nextTargetId("exhausted");

                const result = await subject.run(async storage => {
                    await storage.append(recordFor(targetId));

                    const page = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        limit: 10
                    });

                    return page.isOk() ? page.value : null;
                });

                expect(result!.hasMore).toBe(false);
                expect(result!.cursor).toBeNull();
            });

            it("is stable when records are appended between pages", async () => {
                // The property that rules out offset pagination. This dataset is append-only and
                // read newest-first, so a record arriving between two page reads is the ordinary
                // case. With an offset, every later record shifts down by one and page two
                // re-shows the tail of page one.
                const targetId = nextTargetId("appendmid");

                const seen = await subject.run(async storage => {
                    for (let i = 0; i < 4; i++) {
                        await storage.append(
                            recordFor(targetId, { revision: `${targetId}#old${i}` })
                        );
                    }

                    const first = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        limit: 2
                    });
                    if (!first.isOk()) {
                        return { firstPage: [], secondPage: [] };
                    }

                    // Two brand-new records land at the top of the ordering, above the cursor.
                    await storage.append(recordFor(targetId, { revision: `${targetId}#new0` }));
                    await storage.append(recordFor(targetId, { revision: `${targetId}#new1` }));

                    const second = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        limit: 2,
                        cursor: first.value.cursor
                    });

                    return {
                        firstPage: first.value.records.map(r => r.revision),
                        secondPage: second.isOk() ? second.value.records.map(r => r.revision) : []
                    };
                });

                // No record appears on both pages, and the newcomers do not gatecrash page two.
                const overlap = seen.firstPage.filter(revision =>
                    seen.secondPage.includes(revision)
                );

                expect(overlap).toEqual([]);
                expect(seen.secondPage).not.toContain(`${targetId}#new0`);
                expect(seen.secondPage).not.toContain(`${targetId}#new1`);
            });

            it("treats the cursor as an opaque string", async () => {
                // The suite asserts nothing about the format, only that it is a string a caller
                // can hold and hand back. An implementation is free to change it entirely.
                const targetId = nextTargetId("opaque");

                const cursor = await subject.run(async storage => {
                    await storage.append(recordFor(targetId));
                    await storage.append(recordFor(targetId));

                    const page = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        limit: 1
                    });

                    return page.isOk() ? page.value.cursor : null;
                });

                expect(typeof cursor).toBe("string");
            });
        });

        describe("filtering", () => {
            it("narrows to a single revision", async () => {
                const targetId = nextTargetId("revfilter");

                const revisions = await subject.run(async storage => {
                    await storage.append(recordFor(targetId, { revision: `${targetId}#0001` }));
                    await storage.append(recordFor(targetId, { revision: `${targetId}#0002` }));
                    await storage.append(recordFor(targetId, { revision: `${targetId}#0002` }));

                    const page = unwrap(
                        await storage.list({
                            target: { type: "cms-entry", id: targetId },
                            revision: `${targetId}#0002`
                        }),
                        "list"
                    );

                    return page.records.map(r => r.revision);
                });

                expect(revisions).toHaveLength(2);
                expect(new Set(revisions)).toEqual(new Set([`${targetId}#0002`]));
            });

            it("narrows to a single actor", async () => {
                const targetId = nextTargetId("actorfilter");

                const actorIds = await subject.run(async storage => {
                    await storage.append(
                        recordFor(targetId, {
                            actor: { id: "u-1", type: "admin", displayName: "One" }
                        })
                    );
                    await storage.append(
                        recordFor(targetId, {
                            actor: { id: "u-2", type: "admin", displayName: "Two" }
                        })
                    );

                    const page = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        actorId: "u-2"
                    });

                    return page.isOk() ? page.value.records.map(r => r.actor.id) : [];
                });

                expect(actorIds).toEqual(["u-2"]);
            });

            it("combines the revision and actor filters", async () => {
                const targetId = nextTargetId("bothfilters");

                const count = await subject.run(async storage => {
                    await storage.append(
                        recordFor(targetId, {
                            revision: `${targetId}#0001`,
                            actor: { id: "u-1", type: "admin", displayName: "One" }
                        })
                    );
                    await storage.append(
                        recordFor(targetId, {
                            revision: `${targetId}#0002`,
                            actor: { id: "u-1", type: "admin", displayName: "One" }
                        })
                    );
                    await storage.append(
                        recordFor(targetId, {
                            revision: `${targetId}#0002`,
                            actor: { id: "u-2", type: "admin", displayName: "Two" }
                        })
                    );

                    const page = await storage.list({
                        target: { type: "cms-entry", id: targetId },
                        revision: `${targetId}#0002`,
                        actorId: "u-1"
                    });

                    return page.isOk() ? page.value.records.length : -1;
                });

                expect(count).toBe(1);
            });

            it("never returns another target's records", async () => {
                const mine = nextTargetId("isolated-mine");
                const theirs = nextTargetId("isolated-theirs");

                const targetIds = await subject.run(async storage => {
                    await storage.append(recordFor(mine));
                    await storage.append(recordFor(theirs));

                    const page = await storage.list({ target: { type: "cms-entry", id: mine } });

                    return page.isOk() ? page.value.records.map(r => r.targetId) : [];
                });

                expect(targetIds).toEqual([mine]);
            });
        });

        describe("empty target", () => {
            it("returns an empty page rather than failing", async () => {
                const result = await subject.run(async storage => {
                    const page = await storage.list({
                        target: { type: "cms-entry", id: nextTargetId("never-written") }
                    });

                    return page.isOk() ? page.value : null;
                });

                expect(result).toEqual({ records: [], cursor: null, hasMore: false });
            });

            it("reports deletion of an empty target as finished", async () => {
                const result = await subject.run(async storage => {
                    const outcome = await storage.deleteAllForTarget({
                        type: "cms-entry",
                        id: nextTargetId("empty-delete")
                    });

                    return outcome.isOk() ? outcome.value : null;
                });

                expect(result).toEqual({ finished: true, deleted: 0 });
            });
        });

        describe("purge", () => {
            it("removes every record for the target", async () => {
                const targetId = nextTargetId("purge");

                const outcome = await subject.run(async storage => {
                    for (let i = 0; i < 5; i++) {
                        await storage.append(
                            recordFor(targetId, { revision: `${targetId}#000${i}` })
                        );
                    }

                    const deletion = unwrap(
                        await storage.deleteAllForTarget({ type: "cms-entry", id: targetId }),
                        "deleteAllForTarget"
                    );

                    const page = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list after purge"
                    );

                    return { deletion, remaining: page.records.length };
                });

                expect(outcome.deletion).toMatchObject({ finished: true, deleted: 5 });
                expect(outcome.remaining).toBe(0);
            });

            it("leaves other targets untouched", async () => {
                const doomed = nextTargetId("purge-doomed");
                const spared = nextTargetId("purge-spared");

                const remaining = await subject.run(async storage => {
                    await storage.append(recordFor(doomed));
                    await storage.append(recordFor(spared));
                    await storage.append(recordFor(spared));

                    unwrap(
                        await storage.deleteAllForTarget({ type: "cms-entry", id: doomed }),
                        "deleteAllForTarget"
                    );

                    const page = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: spared } }),
                        "list spared"
                    );

                    return page.records.length;
                });

                expect(remaining).toBe(2);
            });

            it("is idempotent", async () => {
                // A caller that stopped part-way through must be able to simply invoke again.
                const targetId = nextTargetId("purge-twice");

                const second = await subject.run(async storage => {
                    await storage.append(recordFor(targetId));

                    await storage.deleteAllForTarget({ type: "cms-entry", id: targetId });
                    const again = await storage.deleteAllForTarget({
                        type: "cms-entry",
                        id: targetId
                    });

                    return again.isOk() ? again.value : null;
                });

                expect(second).toEqual({ finished: true, deleted: 0 });
            });
        });

        describe("settleSummary", () => {
            it("stores the summary and clears the transient values", async () => {
                const targetId = nextTargetId("settle");

                const record = await subject.run(async storage => {
                    const appended = unwrap(
                        await storage.append(
                            recordFor(targetId, {
                                summaryState: {
                                    taskId: "task-1",
                                    values: [
                                        { path: "title", label: "Title", before: "a", after: "b" }
                                    ],
                                    valuesWrittenOn: new Date().toISOString()
                                }
                            })
                        ),
                        "append"
                    );

                    unwrap(
                        await storage.settleSummary({
                            recordId: appended.id,
                            summary: "Reworked the pricing section."
                        }),
                        "settle"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summary).toBe("Reworked the pricing section.");
                // The obligation: values must not outlive the job that consumed them.
                expect(record?.summaryState?.values).toBeUndefined();
            });

            it("records a reason without a summary", async () => {
                const targetId = nextTargetId("settle-reason");

                const record = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(recordFor(targetId)), "append");

                    unwrap(
                        await storage.settleSummary({
                            recordId: appended.id,
                            reason: "generation-failed"
                        }),
                        "settle"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summary).toBeUndefined();
                expect(record?.summaryState?.reason).toBe("generation-failed");
            });

            it("is idempotent", async () => {
                // A task can run more than once. The second run must be harmless.
                const targetId = nextTargetId("settle-twice");

                const record = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(recordFor(targetId)), "append");

                    await storage.settleSummary({ recordId: appended.id, summary: "Once." });
                    unwrap(
                        await storage.settleSummary({ recordId: appended.id, summary: "Once." }),
                        "second settle"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summary).toBe("Once.");
            });

            it("does nothing when the record is gone", async () => {
                // The entry may have been purged while the job ran. Stopping is correct; failing
                // would retry forever and recreating would resurrect deleted history.
                const outcome = await subject.run(async storage => {
                    const result = await storage.settleSummary({
                        recordId: "does-not-exist#0001",
                        summary: "Nothing to attach this to."
                    });

                    return result.isOk();
                });

                expect(outcome).toBe(true);
            });

            it("does not move the record under the keyset cursor", async () => {
                // The cursor pages on a sort key the adapter owns. An update that reordered would
                // make a reader skip or repeat rows mid-page, which is invisible until it bites.
                const targetId = nextTargetId("settle-order");

                const { before, after, pagedIds } = await subject.run(async storage => {
                    const appended = [];
                    for (let i = 0; i < 5; i++) {
                        appended.push(
                            unwrap(
                                await storage.append(
                                    recordFor(targetId, { revision: `${targetId}#000${i}` })
                                ),
                                `append ${i}`
                            )
                        );
                    }

                    const first = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list before"
                    );

                    // Update one in the middle, then page through and confirm nothing shifted.
                    unwrap(
                        await storage.settleSummary({
                            recordId: appended[2]!.id,
                            summary: "Middle record."
                        }),
                        "settle"
                    );

                    const second = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list after"
                    );

                    const collected: string[] = [];
                    let cursor: string | null = null;
                    let guard = 0;
                    do {
                        const page: ActivityLogStorage.ListResult = unwrap(
                            await storage.list({
                                target: { type: "cms-entry", id: targetId },
                                limit: 2,
                                cursor
                            }),
                            `page ${guard + 1}`
                        );
                        collected.push(...page.records.map(r => r.id));
                        cursor = page.cursor;
                        guard++;
                    } while (cursor && guard < 10);

                    return {
                        before: first.records.map(r => r.id),
                        after: second.records.map(r => r.id),
                        pagedIds: collected
                    };
                });

                expect(after).toEqual(before);
                // Paged two at a time across the updated record: same set, same order, no repeats.
                expect(pagedIds).toEqual(before);
                expect(new Set(pagedIds).size).toBe(pagedIds.length);
            });

            it("leaves a settled record listing normally", async () => {
                const targetId = nextTargetId("settle-list");

                const records = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(recordFor(targetId)), "append");
                    await storage.append(recordFor(targetId, { revision: `${targetId}#0002` }));

                    unwrap(
                        await storage.settleSummary({
                            recordId: appended.id,
                            summary: "Still here."
                        }),
                        "settle"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records;
                });

                expect(records).toHaveLength(2);
                expect(records.some(r => r.summary === "Still here.")).toBe(true);
            });
        });

        describe("findStaleValues", () => {
            it("finds records whose values predate the threshold", async () => {
                const targetId = nextTargetId("stale");
                const old = "2020-01-01T00:00:00.000Z";

                const found = await subject.run(async storage => {
                    const appended = unwrap(
                        await storage.append(
                            recordFor(targetId, {
                                summaryState: {
                                    taskId: "task-old",
                                    values: [
                                        { path: "title", label: "Title", before: "a", after: "b" }
                                    ],
                                    valuesWrittenOn: old
                                }
                            })
                        ),
                        "append"
                    );

                    const stale = unwrap(
                        await storage.findStaleValues({
                            writtenBefore: "2021-01-01T00:00:00.000Z"
                        }),
                        "findStaleValues"
                    );

                    return stale.some(r => r.id === appended.id);
                });

                expect(found).toBe(true);
            });

            it("ignores records whose values are newer than the threshold", async () => {
                const targetId = nextTargetId("stale-recent");

                const found = await subject.run(async storage => {
                    const appended = unwrap(
                        await storage.append(
                            recordFor(targetId, {
                                summaryState: {
                                    taskId: "task-new",
                                    values: [
                                        { path: "title", label: "Title", before: "a", after: "b" }
                                    ],
                                    valuesWrittenOn: new Date().toISOString()
                                }
                            })
                        ),
                        "append"
                    );

                    const stale = unwrap(
                        await storage.findStaleValues({
                            writtenBefore: "2021-01-01T00:00:00.000Z"
                        }),
                        "findStaleValues"
                    );

                    return stale.some(r => r.id === appended.id);
                });

                expect(found).toBe(false);
            });

            it("ignores records carrying no values at all", async () => {
                // The overwhelming majority. A sweep must not walk every record ever written.
                const targetId = nextTargetId("stale-none");

                const found = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(recordFor(targetId)), "append");

                    const stale = unwrap(
                        await storage.findStaleValues({
                            writtenBefore: "2999-01-01T00:00:00.000Z"
                        }),
                        "findStaleValues"
                    );

                    return stale.some(r => r.id === appended.id);
                });

                expect(found).toBe(false);
            });

            it("stops finding a record once its values are settled", async () => {
                const targetId = nextTargetId("stale-settled");
                const old = "2020-01-01T00:00:00.000Z";

                const found = await subject.run(async storage => {
                    const appended = unwrap(
                        await storage.append(
                            recordFor(targetId, {
                                summaryState: {
                                    taskId: "task-x",
                                    values: [
                                        { path: "title", label: "Title", before: "a", after: "b" }
                                    ],
                                    valuesWrittenOn: old
                                }
                            })
                        ),
                        "append"
                    );

                    unwrap(
                        await storage.settleSummary({
                            recordId: appended.id,
                            reason: "abandoned"
                        }),
                        "settle"
                    );

                    const stale = unwrap(
                        await storage.findStaleValues({
                            writtenBefore: "2021-01-01T00:00:00.000Z"
                        }),
                        "findStaleValues"
                    );

                    return stale.some(r => r.id === appended.id);
                });

                expect(found).toBe(false);
            });
        });

        describe("extendSummaryValues", () => {
            const bundle = (paths: string[]) =>
                paths.map(path => ({ path, label: path, before: "old", after: "new" }));

            const pending = (targetId: string) =>
                recordFor(targetId, {
                    summaryState: {
                        taskId: "task-1",
                        values: bundle(["title"]),
                        valuesWrittenOn: new Date().toISOString()
                    }
                });

            it("replaces the bundle on a pending record", async () => {
                const targetId = nextTargetId("extend");

                const record = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(pending(targetId)), "append");

                    unwrap(
                        await storage.extendSummaryValues({
                            recordId: appended.id,
                            values: bundle(["title", "body"])
                        }),
                        "extend"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summaryState?.values).toHaveLength(2);
            });

            it("refuses a record whose summary has already settled", async () => {
                // The race the precondition exists for: a job finishes while a later save is still
                // extending. Overwriting would leave content on a record with no job coming for it.
                const targetId = nextTargetId("extend-settled");

                const record = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(pending(targetId)), "append");

                    unwrap(
                        await storage.settleSummary({
                            recordId: appended.id,
                            summary: "Already written."
                        }),
                        "settle"
                    );

                    unwrap(
                        await storage.extendSummaryValues({
                            recordId: appended.id,
                            values: bundle(["title", "body", "intro"])
                        }),
                        "extend after settle"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summary).toBe("Already written.");
                expect(record?.summaryState?.values).toBeUndefined();
            });

            it("is idempotent", async () => {
                const targetId = nextTargetId("extend-twice");

                const record = await subject.run(async storage => {
                    const appended = unwrap(await storage.append(pending(targetId)), "append");

                    await storage.extendSummaryValues({
                        recordId: appended.id,
                        values: bundle(["title", "body"])
                    });
                    unwrap(
                        await storage.extendSummaryValues({
                            recordId: appended.id,
                            values: bundle(["title", "body"])
                        }),
                        "second extend"
                    );

                    const listed = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list"
                    );

                    return listed.records[0] ?? null;
                });

                expect(record?.summaryState?.values).toHaveLength(2);
            });

            it("does nothing when the record is gone", async () => {
                const outcome = await subject.run(async storage => {
                    const result = await storage.extendSummaryValues({
                        recordId: "does-not-exist#0001",
                        values: bundle(["title"])
                    });

                    return result.isOk();
                });

                expect(outcome).toBe(true);
            });

            it("does not move the record under the keyset cursor", async () => {
                const targetId = nextTargetId("extend-order");

                const { before, after } = await subject.run(async storage => {
                    const appended = [];
                    for (let i = 0; i < 4; i++) {
                        appended.push(
                            unwrap(
                                await storage.append(
                                    recordFor(targetId, {
                                        revision: `${targetId}#000${i}`,
                                        summaryState: {
                                            taskId: "t",
                                            values: bundle(["title"]),
                                            valuesWrittenOn: new Date().toISOString()
                                        }
                                    })
                                ),
                                `append ${i}`
                            )
                        );
                    }

                    const first = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list before"
                    );

                    unwrap(
                        await storage.extendSummaryValues({
                            recordId: appended[1]!.id,
                            values: bundle(["title", "body"])
                        }),
                        "extend"
                    );

                    const second = unwrap(
                        await storage.list({ target: { type: "cms-entry", id: targetId } }),
                        "list after"
                    );

                    return {
                        before: first.records.map(r => r.id),
                        after: second.records.map(r => r.id)
                    };
                });

                expect(after).toEqual(before);
            });
        });
    });
};
