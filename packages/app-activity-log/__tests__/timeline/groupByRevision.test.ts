import { describe, expect, it } from "vitest";
import { groupByRevision, parseVersion } from "~/timeline/groupByRevision.js";
import { discloseItem, summariseItem } from "~/timeline/summariseItem.js";
import { collapseConsecutive } from "~/timeline/collapseConsecutive.js";
import type { TimelineRecord } from "~/timeline/types.js";

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0001",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

const at = (day: number, minutes: number) =>
    new Date(Date.UTC(2026, 8, day, 10, minutes, 0)).toISOString();

describe("parseVersion", () => {
    it("reads the version from a revision id", () => {
        expect(parseVersion("abc#0004")).toBe(4);
    });

    it("returns null rather than NaN for an unexpected shape", () => {
        // A caller rendering "v4" should show nothing rather than "vNaN".
        expect(parseVersion("abc")).toBeNull();
        expect(parseVersion("")).toBeNull();
    });
});

describe("groupByRevision", () => {
    it("groups activity under its revision", () => {
        const groups = groupByRevision([
            record({ revision: "abc#0002", timestamp: at(10, 30) }),
            record({ revision: "abc#0001", timestamp: at(10, 10) })
        ]);

        expect(groups.map(g => g.revision)).toEqual(["abc#0002", "abc#0001"]);
    });

    it("orders groups by their newest activity, not by version", () => {
        // A review transition can land on an older revision after work started on a newer one.
        // Ordering by version would put stale activity above fresh activity.
        const groups = groupByRevision([
            record({ revision: "abc#0001", timestamp: at(11, 0), action: "review.step.approved" }),
            record({ revision: "abc#0002", timestamp: at(10, 0) })
        ]);

        expect(groups.map(g => g.revision)).toEqual(["abc#0001", "abc#0002"]);
    });

    it("exposes the version for display, and null when absent", () => {
        const groups = groupByRevision([
            record({ revision: "abc#0003" }),
            record({ revision: "legacy", timestamp: at(9, 0) })
        ]);

        expect(groups.find(g => g.revision === "abc#0003")!.version).toBe(3);
        expect(groups.find(g => g.revision === "legacy")!.version).toBeNull();
    });

    it("orders records within a group newest first, whatever order they arrived in", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 10) }),
            record({ timestamp: at(10, 40) }),
            record({ timestamp: at(10, 25) })
        ]);

        expect(groups[0]!.items[0]!.latest.timestamp).toBe(at(10, 40));
    });

    it("collapses within a group", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 20) }),
            record({ timestamp: at(10, 15) }),
            record({ timestamp: at(10, 10) })
        ]);

        expect(groups[0]!.items).toHaveLength(1);
        expect(groups[0]!.items[0]!.records).toHaveLength(3);
    });

    it("reports the group's span", () => {
        const groups = groupByRevision([
            record({ timestamp: at(10, 40) }),
            record({ timestamp: at(10, 5) })
        ]);

        expect(groups[0]!.latestTimestamp).toBe(at(10, 40));
        expect(groups[0]!.earliestTimestamp).toBe(at(10, 5));
    });

    it("returns nothing for no records", () => {
        expect(groupByRevision([])).toEqual([]);
    });
});

describe("summariseItem", () => {
    it("says how much changed, not what", () => {
        // A closed row that already named every field would make expanding pointless.
        const [item] = collapseConsecutive([
            record({
                changeset: [
                    { path: "title", label: "Title" },
                    { path: "body", label: "Body" }
                ]
            })
        ]);

        const summary = summariseItem(item!);

        expect(summary.changedFieldCount).toBe(2);
        expect(Object.keys(summary)).not.toContain("changeset");
    });

    it("counts the records a collapsed row stands for", () => {
        const [item] = collapseConsecutive([
            record({ timestamp: at(10, 20) }),
            record({ timestamp: at(10, 15) })
        ]);

        expect(summariseItem(item!).occurrences).toBe(2);
        expect(summariseItem(item!).spansTime).toBe(true);
    });

    it("does not claim a span for a single record", () => {
        const [item] = collapseConsecutive([record()]);

        expect(summariseItem(item!).spansTime).toBe(false);
    });

    it("reports a redacted actor as redacted rather than as a blank name", () => {
        const [item] = collapseConsecutive([
            record({ actor: { id: "", type: "", displayName: "" } })
        ]);

        const summary = summariseItem(item!);

        expect(summary.actorRedacted).toBe(true);
        expect(summary.actorDisplayName).toBeNull();
    });

    it("carries a summary onto the row it covers, and says who wrote it", () => {
        const [item] = collapseConsecutive([
            record({ summary: "Rewrote the intro.", summaryKind: "ai" })
        ]);

        expect(summariseItem(item!).summary).toEqual({
            text: "Rewrote the intro.",
            generated: true
        });
    });

    it("does not call a rendered summary generated", () => {
        // The mark exists to separate a model's prose from a restatement of what was recorded.
        // Marking both would make it mean nothing.
        const [item] = collapseConsecutive([
            record({ summary: "Changed On sale from Yes to No.", summaryKind: "deterministic" })
        ]);

        expect(summariseItem(item!).summary).toEqual({
            text: "Changed On sale from Yes to No.",
            generated: false
        });
    });

    it("carries no summary when the row has none, which is the usual case", () => {
        const [item] = collapseConsecutive([record()]);

        const summary = summariseItem(item!);

        expect(summary.summary).toBeNull();
        expect(summary.summaryPending).toBe(false);
    });

    it("withholds a summary from a row that holds more than one", () => {
        // A row collapses on an hour and a summary is debounced on a minute, so one row can hold
        // several runs. Putting one of their sentences on the closed row would attribute it to
        // saves it never saw; the expansion shows them all instead.
        const [item] = collapseConsecutive([
            record({ timestamp: at(10, 50), summary: "Rewrote the intro." }),
            record({ timestamp: at(10, 10), summary: "Tightened the pricing copy." })
        ]);

        expect(summariseItem(item!).summary).toBeNull();
    });

    it("withholds the row's sentence when the row holds more than one run", () => {
        // The same judgement as refusing to name a field on a truncated changeset: the row stands
        // for more than the sentence on offer, and offering it anyway attributes a statement to
        // saves it was never about.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 50), summary: "Rewrote the intro." }),
            record({ id: "c", timestamp: at(10, 10), summary: "Reworded the title." })
        ]);

        expect(summariseItem(item!).summary).toBeNull();
    });

    it("carries the sentence when several saves belong to one run", () => {
        // Several saves is not several runs. A row that maps onto one run is unambiguous however
        // many saves it holds.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a" })
        ]);

        expect(summariseItem(item!).summary?.text).toBe("Rewrote the intro.");
    });

    it("never puts pending beside a sentence the row already has", () => {
        // "Summarising…" beneath a settled sentence reads as though that sentence is the one being
        // worked on. It is not — the run still in flight is a different run.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a", summaryPending: true })
        ]);

        const summary = summariseItem(item!);

        expect(summary.summary?.text).toBe("Rewrote the intro.");
        expect(summary.summaryPending).toBe(false);
    });

    it("reports pending when any save in the row is still waiting", () => {
        // The pending record is the *oldest* in the row, which is where it really sits: the save
        // that dispatched the job is the one carrying the values, and later saves join it. A
        // fixture with the flag on the newest record would pass against an implementation that
        // only ever looked at `latest`.
        const [item] = collapseConsecutive([
            record({ timestamp: at(10, 20) }),
            record({ timestamp: at(10, 15), summaryPending: true })
        ]);

        expect(summariseItem(item!).summaryPending).toBe(true);
    });

    it("does not report pending for a row that has settled without a summary", () => {
        // Failed, swept, suppressed, never qualified — all the same shape by the time it reaches
        // here, and none of them is something a reader can act on.
        const [item] = collapseConsecutive([record({ summaryPending: false })]);

        expect(summariseItem(item!).summaryPending).toBe(false);
    });

    it("surfaces the review step and whether a note was left", () => {
        const [item] = collapseConsecutive([
            record({
                action: "review.step.approved",
                subject: { id: "s1", label: "Legal review" },
                hasNote: true
            })
        ]);

        const summary = summariseItem(item!);

        expect(summary.subjectLabel).toBe("Legal review");
        expect(summary.hasNote).toBe(true);
    });

    it("treats an absent note as no note", () => {
        const [item] = collapseConsecutive([record({ action: "review.step.approved" })]);

        expect(summariseItem(item!).hasNote).toBe(false);
    });
});

describe("discloseItem", () => {
    it("describes each changed path readably", () => {
        const [item] = collapseConsecutive([
            record({
                changeset: [{ path: "sections#a1b2c3d4e5f6.blocks[2].title", label: "Title" }]
            })
        ]);

        expect(discloseItem(item!).runs[0]!.saves[0]!.changes[0]!.text).toBe(
            "Sections › Blocks › Title"
        );
    });

    it("states that values are not available rather than leaving it to be inferred", () => {
        // The feature records no content values by design. An empty space would read as a bug.
        const [item] = collapseConsecutive([record()]);

        expect(discloseItem(item!).valuesAvailable).toBe(false);
    });

    it("never carries a value in the changeset, whatever the changeset holds", () => {
        // Asserted on the shape rather than by searching the JSON for "value" — that matched the
        // legitimate `valuesAvailable` flag and would have passed for the wrong reason.
        //
        // The scope narrowed when summaries arrived and it is worth being exact about why. A
        // *change* still carries a path, a label and an operation and nothing else, which is the
        // property this guards. A *summary* is prose written about the change and may quote a
        // fragment of it — that is disclosure by design, gated server-side, and not something this
        // shape can or should prevent.
        const [item] = collapseConsecutive([
            record({ changeset: [{ path: "salary", label: "Salary" }] })
        ]);

        const disclosure = discloseItem(item!);

        expect(Object.keys(disclosure).sort()).toEqual([
            "hasSentence",
            "runs",
            "truncated",
            "valuesAvailable"
        ]);

        for (const run of disclosure.runs) {
            expect(Object.keys(run).sort()).toEqual([
                "grouped",
                "id",
                "pending",
                "saves",
                "summary"
            ]);

            for (const save of run.saves) {
                expect(Object.keys(save).sort()).toEqual([
                    "changes",
                    "id",
                    "sentence",
                    "timestamp",
                    "truncated"
                ]);

                for (const change of save.changes) {
                    expect(Object.keys(change).sort()).toEqual([
                        "ancestors",
                        "label",
                        "operation",
                        "text"
                    ]);
                }
            }
        }
    });

    it("keeps each save's fields to that save", () => {
        // A row can stand for four saves, and merging their changesets answers a question nobody
        // asked: "these six fields changed at some point across them".
        const [item] = collapseConsecutive([
            record({ timestamp: at(10, 20), changeset: [{ path: "title", label: "Title" }] }),
            record({ timestamp: at(10, 15), changeset: [{ path: "body", label: "Body" }] })
        ]);

        const disclosure = discloseItem(item!);

        expect(
            disclosure.runs.flatMap(run => run.saves.map(save => save.changes.map(c => c.label)))
        ).toEqual([["Title"], ["Body"]]);
    });

    it("attaches each sentence to the run it covers, newest first", () => {
        // Three saves, two runs, and nothing stacked: each sentence sits with the saves it
        // describes rather than in a block above all of them.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a" }),
            record({ id: "c", timestamp: at(10, 10), summary: "Tightened the pricing copy." })
        ]);

        const runs = discloseItem(item!).runs;

        expect(runs.map(run => run.summary?.text ?? null)).toEqual([
            "Rewrote the intro.",
            "Tightened the pricing copy."
        ]);
        expect(runs.map(run => run.saves.map(save => save.id))).toEqual([["a", "b"], ["c"]]);
    });

    it("groups by the run each record names, not by where it sits", () => {
        // The reason membership is stored at all. Interleaved saves are ordinary — a run debounces
        // on a minute and a row collapses on an hour — and grouping by adjacency would put a
        // sentence at the head of saves it never covered.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 30), summary: "Rewrote the intro." }),
            record({ id: "x", timestamp: at(10, 25), summary: "Reworded the title." }),
            record({ id: "b", timestamp: at(10, 20), summaryRunId: "a" })
        ]);

        const runs = discloseItem(item!).runs;

        expect(runs.map(run => run.id)).toEqual(["a", "x"]);
        // `b` sits two positions from `a` and still belongs to it.
        expect(runs[0]!.saves.map(save => save.id)).toEqual(["a", "b"]);
    });

    it("gives a record that joined no run a run of its own", () => {
        // The unsummarised majority, and the reason the client needs no special case for them.
        const [item] = collapseConsecutive([record({ id: "solo" })]);

        expect(discloseItem(item!).runs.map(run => run.id)).toEqual(["solo"]);
    });

    it("wraps a run that covers several saves under one sentence", () => {
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a" }),
            record({ id: "c", timestamp: at(10, 10), summary: "Reworded the title." })
        ]);

        const runs = discloseItem(item!).runs;

        expect(runs[0]!.grouped).toBe(true);
        // A run of one has nothing to bind together.
        expect(runs[1]!.grouped).toBe(false);
    });

    it("does not wrap a run of several that produced no sentence", () => {
        // Without a sentence to head it a run is invisible to a reader, and a box around it would
        // assert a grouping that says nothing.
        //
        // Two runs on purpose: with one, the sole-run rule would make this false anyway and the
        // test would pass without the sentence condition doing any work.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20) }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a" }),
            record({ id: "c", timestamp: at(10, 10), summary: "Reworded the title." })
        ]);

        const runs = discloseItem(item!).runs;

        expect(runs[0]!.saves).toHaveLength(2);
        expect(runs[0]!.grouped).toBe(false);
    });

    it("does not wrap the only run in a row, however many saves it covers", () => {
        // Its sentence is in the row's header, so there is nothing in the expansion to distinguish
        // these saves from. A box around every save in the row would assert a grouping that
        // carries no information.
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "b", timestamp: at(10, 15), summaryRunId: "a" })
        ]);

        const runs = discloseItem(item!).runs;

        expect(runs).toHaveLength(1);
        expect(runs[0]!.saves).toHaveLength(2);
        expect(runs[0]!.grouped).toBe(false);
    });

    it("does not repeat the row's pending note inside the expansion", () => {
        // The same rule as the sentence, not a second one: a row with a single run is that run's
        // heading, and the header is on screen when the row opens.
        const [item] = collapseConsecutive([record({ id: "a", summaryPending: true })]);

        expect(summariseItem(item!).summaryPending).toBe(true);
        expect(discloseItem(item!).runs[0]!.pending).toBe(false);
    });

    it("withholds the run's sentence from the expansion when the row already shows it", () => {
        // A single-save row shows its sentence in the header, and the header stays on screen when
        // the row opens. Showing it again underneath is the duplication this shape removes.
        const [item] = collapseConsecutive([record({ id: "a", summary: "Rewrote the intro." })]);

        expect(summariseItem(item!).summary?.text).toBe("Rewrote the intro.");
        expect(discloseItem(item!).runs[0]!.summary).toBeNull();
    });

    it("shows each sentence in the expansion when the row shows none", () => {
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "c", timestamp: at(10, 10), summary: "Reworded the title." })
        ]);

        expect(summariseItem(item!).summary).toBeNull();
        expect(discloseItem(item!).runs.map(run => run.summary?.text)).toEqual([
            "Rewrote the intro.",
            "Reworded the title."
        ]);
    });

    it("says which run is waiting, rather than which row", () => {
        const [item] = collapseConsecutive([
            record({ id: "a", timestamp: at(10, 20), summary: "Rewrote the intro." }),
            record({ id: "c", timestamp: at(10, 10), summaryPending: true })
        ]);

        expect(discloseItem(item!).runs.map(run => run.pending)).toEqual([false, true]);
    });

    it("says so when the list is incomplete", () => {
        // A truncated list rendered as complete is worse than no list: a reader would conclude
        // the unlisted fields did not change.
        const [item] = collapseConsecutive([record({ truncated: true })]);

        expect(discloseItem(item!).truncated).toBe(true);
    });
});
