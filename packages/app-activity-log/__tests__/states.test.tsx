import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ActivityTimelineView } from "~/components/ActivityTimeline.js";
import { buildTimelineView } from "~/hooks/buildTimelineView.js";
import type { TimelineFilters } from "~/hooks/buildTimelineView.js";
import type { TimelineRecord } from "~/timeline/types.js";

/**
 * The eight states from the brief, as executable acceptance criteria.
 *
 * Deliberately asserts nothing about layout, hierarchy or structure — all of which the design
 * handover will replace. Each state asserts only that it renders without throwing and that one
 * distinguishing statement reaches the screen, so a design pass that silently drops a state fails
 * here instead of leaving a gap nobody notices until a customer hits it.
 *
 * If one of these breaks during the handover, the fix is to make the new component say the same
 * thing — not to delete the test.
 */

/**
 * Automatic cleanup is not configured in this repo's vitest setup, so without this every render
 * stays in `document.body` and `screen` queries see earlier tests' markup. It shows up as
 * "found multiple elements" the moment two tests describe a similar row — a false failure that
 * would otherwise be worked around by making assertions less specific.
 */
afterEach(cleanup);

let seq = 0;

const record = (overrides: Partial<TimelineRecord> = {}): TimelineRecord => {
    seq++;
    return {
        id: `rec-${seq}`,
        targetType: "cms-entry",
        targetId: "abc",
        revision: "abc#0002",
        timestamp: "2026-09-10T10:00:00.000Z",
        actor: { id: "u-1", type: "admin", displayName: "Ada Editor" },
        action: "entry.update",
        source: "admin",
        correlationId: `corr-${seq}`,
        changeset: [],
        truncated: false,
        ...overrides
    };
};

const renderState = (
    records: TimelineRecord[],
    options: {
        filters?: TimelineFilters;
        hasMore?: boolean;
        currentRevision?: string;
        currentStatus?: string | null;
        loading?: boolean;
        refreshing?: boolean;
        error?: string | null;
    } = {}
) => {
    const filters = options.filters ?? {};
    const hasMore = options.hasMore ?? false;

    const rendered = render(
        <AdminUiProvider>
            <ActivityTimelineView
                view={buildTimelineView({
                    records,
                    filters,
                    hasMore,
                    currentRevision: options.currentRevision,
                    currentStatus: options.currentStatus
                })}
                loading={options.loading ?? false}
                loadingMore={false}
                refreshing={options.refreshing ?? false}
                error={options.error ?? null}
                hasMore={hasMore}
                filters={filters}
                setFilters={vi.fn()}
                clearFilters={vi.fn()}
                loadMore={vi.fn()}
            />
        </AdminUiProvider>
    );

    return {
        ...rendered,
        /**
         * Everything the component says, as one string.
         *
         * Asserted on text rather than on DOM nodes deliberately: the point is that a statement
         * reaches the reader, and any assertion about elements or nesting would be an assertion
         * about layout — which the design handover is going to replace.
         */
        text: () => rendered.container.textContent ?? ""
    };
};

/**
 * Where `needle` next appears after `from`.
 *
 * Ordering assertions need this because a collapsed row that carries no sentence now names the
 * fields it touched — so a bare `indexOf` on a field name finds the row's own line rather than the
 * chip in the expansion, and the assertion would be about the wrong thing entirely.
 */
const nextAfter = (haystack: string, needle: string, from: number) =>
    haystack.indexOf(needle, from);

describe("the eight states", () => {
    it("1. the grouped timeline names each revision it groups under", () => {
        const { text } = renderState([
            record({ revision: "abc#0002", timestamp: "2026-09-10T10:00:00.000Z" }),
            record({ revision: "abc#0001", timestamp: "2026-09-09T10:00:00.000Z" })
        ]);

        expect(text()).toContain("Revision 2");
        expect(text()).toContain("Revision 1");
    });

    it("2. a row with no sentence names the fields it touched", () => {
        // A reversal, and a deliberate one. A closed row used to say how much changed and never
        // what, so that expanding had something to offer. But a row with no sentence had only a
        // count, which reads as unfinished beside a row that carries one — and the fields are the
        // thing that makes the two shapes sit together in a list.
        const { text } = renderState([
            record({
                changeset: [
                    { path: "title", label: "Title" },
                    { path: "body", label: "Body" }
                ]
            })
        ]);

        expect(text()).toContain("edited 2 fields");
        expect(text()).toContain("Title and Body");
    });

    it("2a. a row that carries a sentence does not also list its fields", () => {
        // The sentence says more than the list does, and both would be the same information twice.
        const { text } = renderState([
            record({
                changeset: [
                    { path: "title", label: "Title" },
                    { path: "body", label: "Body" }
                ],
                summary: "Reworked the header.",
                summaryKind: "deterministic"
            })
        ]);

        expect(text()).toContain("Reworked the header.");
        expect(text()).not.toContain("Title and Body");
    });

    it("3. structural changes name the operation", () => {
        const { text } = renderState([
            record({
                changeset: [
                    { path: "sections#a1b2c3d4e5f6", label: "Sections", operation: "added" }
                ]
            })
        ]);

        // The sentence names the structural operation before anything is expanded, because adding
        // a block is one editorial action rather than a field count.
        expect(text()).toContain("added a block");

        fireEvent.click(screen.getByRole("button", { name: /added a block/ }));

        expect(text()).toContain("added");
    });

    it("4. a review transition names the action and the step", () => {
        const { text } = renderState([
            record({
                action: "review.step.approved",
                subject: { id: "s1", label: "Legal review" },
                hasNote: true
            })
        ]);

        expect(text()).toContain("approved a review step");
        expect(text()).toContain("Legal review");
        // No badge beside it. "Step approved" said the same thing as "approved a review step" and
        // sat between the actor's name and that sentence, pushing the sentence right on exactly
        // the rows that had one — so a badged row's second line started at a different x than an
        // unbadged row's directly above it.
        expect(text()).not.toContain("Step approved");
    });

    // State 5, both filters, is asserted on the data the filter row is given rather than on the
    // rendered controls. The design system's Select is Radix-based and has no jsdom rendering
    // precedent in this repo, and fighting a dropdown would test the design system rather than
    // this feature. What matters — which filters are offered — is a shaping decision, so it is
    // asserted where the decision is made.
    it("5. both filters are offered when there is something to filter by", () => {
        const view = buildTimelineView({
            records: [
                record({ revision: "abc#0002" }),
                record({
                    revision: "abc#0001",
                    actor: { id: "u-2", type: "admin", displayName: "Grace" }
                })
            ],
            filters: {},
            hasMore: false
        });

        expect(view.revisions).toHaveLength(2);
        expect(view.actors).toHaveLength(2);
    });

    it("5b. the actor filter is not offered when every actor is redacted", () => {
        // A reader without actor identity cannot filter by actor, and the API rejects the attempt.
        const view = buildTimelineView({
            records: [record({ actor: { id: "", type: "", displayName: "" } })],
            filters: {},
            hasMore: false
        });

        expect(view.revisions).toHaveLength(1);
        expect(view.actors).toEqual([]);
    });

    it("6. pagination is offered only when more remains", () => {
        const more = renderState([record()], { hasMore: true });

        expect(more.text()).toContain("Load older activity");

        more.unmount();
        const done = renderState([record()], { hasMore: false });

        expect(done.text()).not.toContain("Load older activity");
    });

    it("7. the empty state says we have no record, not that nothing happened", () => {
        // "Nothing has happened yet" would be false for an entry that predates the feature, and
        // "no activity" reads as data loss.
        const { text } = renderState([]);

        expect(text()).toContain("no record of this entry");
    });

    it("7b. a filter matching nothing is a different message entirely", () => {
        const { text } = renderState([], { filters: { actorId: "u-9" } });

        expect(text()).toContain("No activity matches these filters");
        expect(text()).not.toContain("no record of this entry");
    });

    it("8. an entry predating the feature shows its activity and the boundary", () => {
        // The common case after an upgrade: created before the feature, edited since. Both the
        // activity and the boundary have to appear — one without the other is misleading.
        const { text } = renderState([record({ timestamp: "2026-09-09T16:20:00.000Z" })]);

        expect(text()).toContain("was not recorded");
        expect(text()).toContain("Revision 2");
    });

    it("8b. an entry recorded from creation shows no boundary", () => {
        const { text } = renderState([record({ action: "entry.create" })]);

        expect(text()).not.toContain("was not recorded");
    });
});

describe("refreshing after a save", () => {
    it("keeps the rows on screen and says it is updating", () => {
        // The reason a save refreshes in place rather than through the loading state: swapping the
        // reader's rows for a skeleton on every save would feel worse than not refreshing at all.
        const { text } = renderState([record({ action: "entry.create" })], { refreshing: true });

        expect(text()).toContain("Updating");
        expect(text()).toContain("Revision 2");
    });

    it("says nothing when it is not refreshing", () => {
        const { text } = renderState([record()]);

        expect(text()).not.toContain("Updating");
    });
});

describe("the design's reading of a revision", () => {
    it("says how much happened in a revision and when, without expanding anything", () => {
        const at = (day: number) => new Date(Date.UTC(2026, 8, day, 10)).toISOString();
        const { text } = renderState([
            record({ timestamp: at(2) }),
            record({ timestamp: at(1), action: "entry.publish" })
        ]);

        expect(text()).toContain("2 saves");
        expect(text()).toContain("1–2 Sep");
    });

    it("marks the revision the form is showing", () => {
        // Not derived from the records: a review transition can land on an older revision, so the
        // newest record is not evidence of which revision is current.
        const { text } = renderState([record({ revision: "abc#0002" })], {
            currentRevision: "abc#0002",
            currentStatus: "draft"
        });

        expect(text()).toContain("Current");
        expect(text()).toContain("draft");
    });

    it("does not mark a revision current when the form is on another one", () => {
        const { text } = renderState([record({ revision: "abc#0001" })], {
            currentRevision: "abc#0002"
        });

        expect(text()).not.toContain("Current");
    });

    it("names who was involved in the revision", () => {
        const { text } = renderState([record()]);

        expect(text()).toContain("Ada Editor");
    });
});

describe("deep field paths, as the design resolves them", () => {
    it("leads with the field and places it with a path", () => {
        // Treatment B. The changed thing is what a reader is looking for; the containers are how
        // they place it. A full inline path is precise and scans terribly.
        const { text } = renderState([
            record({
                changeset: [
                    { path: "pageBody.testimonials#a1b2c3.heading", label: "Heading" },
                    { path: "title", label: "Title" }
                ]
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /edited 2 fields/ }));

        expect(text()).toContain("Heading");
        expect(text()).toContain("Page body");
        expect(text()).toContain("Testimonials");
    });

    it("gives a positional item its number and an identified one none", () => {
        // A stable id says *which* block changed but not where it sits, and its position may since
        // have moved. Inventing one would be a guess a reader would act on.
        const positional = renderState([
            record({ changeset: [{ path: "sections[2].title", label: "Title" }] })
        ]);
        fireEvent.click(screen.getByRole("button", { name: /edited Title/ }));
        expect(positional.text()).toContain("item 3");

        positional.unmount();

        const identified = renderState([
            record({ changeset: [{ path: "sections#a1b2c3.title", label: "Title" }] })
        ]);
        fireEvent.click(screen.getByRole("button", { name: /edited Title/ }));
        expect(identified.text()).not.toContain("item ");
    });
});

describe("summaries, of which only one state is a state", () => {
    const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes)).toISOString();
    const SENTENCE = "Rewrote the pricing heading and tightened the body copy.";

    it("puts the run's summary on the closed row", () => {
        const { text } = renderState([
            record({ changeset: [{ path: "body", label: "Body" }], summary: SENTENCE })
        ]);

        expect(text()).toContain(SENTENCE);
    });

    it("marks the sentence as generated, because nothing else on this timeline is", () => {
        // Every other line is a record of what was captured. This one was written by a model, it
        // is kept as long as the record is, and some of them will be wrong.
        const { text } = renderState([
            record({
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE,
                summaryKind: "ai"
            })
        ]);

        expect(text()).toContain("AI-generated");
    });

    it("never marks a sentence built from the values", () => {
        // The marker was a disclosure signal when only generated sentences quoted values. Both
        // tiers quote them now, so it is purely a provenance signal — and it is the only thing
        // separating an exact statement from an interpretive one. Marking both would make the
        // distinction invisible again.
        const { text } = renderState([
            record({
                changeset: [{ path: "sku", label: "SKU" }],
                summary: "Changed SKU from 1001 to 1002.",
                summaryKind: "deterministic"
            })
        ]);

        expect(text()).toContain("Changed SKU from 1001 to 1002.");
        expect(text()).not.toContain("AI-generated");
    });

    it("does not mark one inside the expansion either", () => {
        // Confirmed rather than assumed: a sentence can render in two places, and a second marker
        // added to the wrong one would be invisible until someone read a timeline.
        const { text } = renderState([
            record({
                id: "a",
                timestamp: at(50),
                changeset: [{ path: "sku", label: "SKU" }],
                summary: "Changed SKU from 1001 to 1002.",
                summaryKind: "deterministic"
            }),
            record({
                id: "b",
                timestamp: at(10),
                changeset: [{ path: "price", label: "Price" }],
                summary: "Changed Price from 10 to 12.",
                summaryKind: "deterministic"
            })
        ]);

        // Two runs, so neither sentence is on the closed row and both are in the expansion.
        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        expect(text()).toContain("Changed SKU from 1001 to 1002.");
        expect(text()).toContain("Changed Price from 10 to 12.");
        expect(text()).not.toContain("AI-generated");
    });

    it("marks the model's sentence and not the one beside it", () => {
        // The strongest form of the check: both kinds in one expansion. The marker has to track
        // what wrote the sentence, not that there is one.
        const { text } = renderState([
            record({
                id: "a",
                timestamp: at(50),
                changeset: [{ path: "sku", label: "SKU" }],
                summary: "Rewrote the description and raised the price.",
                summaryKind: "ai"
            }),
            record({
                id: "b",
                timestamp: at(10),
                changeset: [{ path: "price", label: "Price" }],
                summary: "Changed Price from 10 to 12.",
                summaryKind: "deterministic"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        expect(text().match(/AI-generated/g)).toHaveLength(1);
    });

    it("does not mark anything when there is no summary to mark", () => {
        const { text } = renderState([record({ changeset: [{ path: "body", label: "Body" }] })]);

        expect(text()).not.toContain("AI-generated");
    });

    it("marks each summary once, not the row", () => {
        const { text } = renderState([
            record({
                timestamp: at(50),
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE,
                summaryKind: "ai"
            }),
            record({
                timestamp: at(10),
                changeset: [{ path: "title", label: "Title" }],
                summary: "Reworded the page title.",
                summaryKind: "ai"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        expect(text().match(/AI-generated/g)).toHaveLength(2);
    });

    it("keeps the deterministic sentence alongside it, not instead of it", () => {
        // The summary is an enrichment. A row that traded its own description for generated prose
        // would lose the one part of itself that is derived from what was recorded.
        const { text } = renderState([
            record({ changeset: [{ path: "body", label: "Body" }], summary: SENTENCE })
        ]);

        expect(text()).toContain("edited Body");
        expect(text()).toContain(SENTENCE);
    });

    it("shows each save's own description when expanded, rather than one merged list", () => {
        const { text } = renderState([
            record({
                timestamp: at(20),
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE
            }),
            record({ timestamp: at(19), changeset: [{ path: "title", label: "Title" }] })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        const rendered = text();

        // Both runs' sentences, and each run's own field beneath its own sentence.
        expect(rendered).toContain(SENTENCE);
        expect(rendered).toContain("edited Title");
        expect(nextAfter(rendered, "Body", rendered.indexOf(SENTENCE))).toBeGreaterThan(-1);
    });

    it("leads the expansion with the summaries, above the saves", () => {
        // Two summaries on purpose, so the closed row carries none of them. With one, the sentence
        // is already on screen before anything is expanded and an ordering check would pass
        // whatever the expansion did with it.
        const { text } = renderState([
            record({
                timestamp: at(50),
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE
            }),
            record({
                timestamp: at(10),
                changeset: [{ path: "title", label: "Title" }],
                summary: "Reworded the page title."
            })
        ]);

        expect(text()).not.toContain(SENTENCE);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        const rendered = text();

        const first = rendered.indexOf(SENTENCE);
        const second = rendered.indexOf("Reworded the page title.");

        expect(first).toBeGreaterThan(-1);
        expect(first).toBeLessThan(second);
        expect(nextAfter(rendered, "Body", first)).toBeLessThan(second);
        expect(nextAfter(rendered, "Title", second)).toBeGreaterThan(second);
    });

    it("shows a single run's sentence once, collapsed and expanded alike", () => {
        // The duplication this shape removed: the header stays on screen when a row opens, so a
        // sentence rendered again at the top of the expansion appeared twice.
        const { text } = renderState([
            record({
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE,
                summaryKind: "ai"
            })
        ]);

        expect(text().match(/Rewrote the pricing heading/g)).toHaveLength(1);

        fireEvent.click(screen.getByRole("button", { name: /edited Body/ }));

        expect(text().match(/Rewrote the pricing heading/g)).toHaveLength(1);
    });

    it("heads each run with its sentence and puts that run's saves beneath it", () => {
        // The save in the middle belongs to the first run and sits second in time, so a reader
        // ordering by position would put it under the wrong sentence. Membership is read from the
        // record, which is why the row can be interleaved and still group correctly.
        const { text } = renderState([
            record({
                id: "a",
                timestamp: at(30),
                changeset: [{ path: "alpha", label: "Alpha" }],
                summary: "Reworked the first run.",
                summaryKind: "ai"
            }),
            record({
                id: "x",
                timestamp: at(25),
                changeset: [{ path: "xray", label: "Xray" }],
                summary: "A different run entirely.",
                summaryKind: "ai"
            }),
            record({
                id: "b",
                timestamp: at(20),
                changeset: [{ path: "beta", label: "Beta" }],
                summaryRunId: "a"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 3 saves/ }));

        const rendered = text();

        // The first run's sentence, then both of its saves, and only then the second run.
        // Measured forward from each sentence, because a closed row with no sentence names the
        // same fields on its own line and a bare indexOf would be reading that instead.
        const first = rendered.indexOf("Reworked the first run.");
        const second = rendered.indexOf("A different run entirely.");

        expect(first).toBeGreaterThan(-1);
        expect(first).toBeLessThan(second);

        // Both of the first run's saves sit under its sentence, before the second run begins —
        // including Beta, which is second in time and would fall under the wrong sentence if
        // grouping read position rather than membership.
        expect(nextAfter(rendered, "Alpha", first)).toBeLessThan(second);
        expect(nextAfter(rendered, "Beta", first)).toBeLessThan(second);
        expect(nextAfter(rendered, "Xray", second)).toBeGreaterThan(second);
    });

    it("gives a record that joined no run a run of its own", () => {
        // The unsummarised majority, and the case a client-side fallback would have collapsed into
        // one enormous run.
        const { text } = renderState([
            record({
                id: "a",
                timestamp: at(30),
                changeset: [{ path: "alpha", label: "Alpha" }],
                summary: "One save, one run.",
                summaryKind: "deterministic"
            }),
            record({
                id: "b",
                timestamp: at(20),
                changeset: [{ path: "beta", label: "Beta" }],
                summary: "Another save, another run.",
                summaryKind: "deterministic"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        const rendered = text();

        const first = rendered.indexOf("One save, one run.");
        const second = rendered.indexOf("Another save, another run.");

        expect(first).toBeGreaterThan(-1);
        expect(first).toBeLessThan(second);
        expect(nextAfter(rendered, "Alpha", first)).toBeLessThan(second);
        expect(nextAfter(rendered, "Beta", second)).toBeGreaterThan(second);
    });

    it("puts pending against the run waiting for it, never beside a settled sentence", () => {
        // What the screenshot showed: a settled sentence with "Summarising…" beneath it claims
        // that sentence is the one being worked on. The job in flight was always a different run.
        const { text } = renderState([
            record({
                id: "a",
                timestamp: at(30),
                changeset: [{ path: "alpha", label: "Alpha" }],
                summary: "Settled long ago.",
                summaryKind: "ai"
            }),
            record({
                id: "b",
                timestamp: at(20),
                changeset: [{ path: "beta", label: "Beta" }],
                summaryPending: true
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        const rendered = text();

        // The row header says the row is waiting, which is true and carries no sentence beside it.
        const settled = rendered.indexOf("Settled long ago.");
        expect(rendered.indexOf("Summarising")).toBeLessThan(settled);

        // Inside the expansion the placeholder sits with the run that is waiting: after the
        // settled run's sentence and its field, and before the waiting run's own field.
        expect(nextAfter(rendered, "Alpha", settled)).toBeLessThan(
            rendered.lastIndexOf("Summarising")
        );
        expect(rendered.lastIndexOf("Summarising")).toBeLessThan(
            nextAfter(rendered, "Beta", settled)
        );
    });

    it("says a summary is coming, which is the only state it distinguishes", () => {
        // On the older save, which is where pending really sits: the save that dispatched the job
        // carries the values, and later saves join it.
        const { text } = renderState([
            record({ timestamp: at(20), changeset: [{ path: "title", label: "Title" }] }),
            record({
                timestamp: at(19),
                changeset: [{ path: "body", label: "Body" }],
                summaryPending: true
            })
        ]);

        expect(text()).toContain("Summarising");
    });

    it("says nothing at all once a record has settled without one", () => {
        // Failed, swept, suppressed, never qualified: four different histories, one appearance.
        // Anything that read as broken here would be broken for the overwhelming majority of rows,
        // which never had a summary to begin with.
        const { text } = renderState([
            record({ changeset: [{ path: "body", label: "Body" }], summaryPending: false })
        ]);

        const rendered = text();

        expect(rendered).toContain("edited Body");
        // Nothing about summaries at all — not a placeholder, not a state, not the word. Listing
        // failure words instead was the weaker test it looked like: "No summary available" would
        // have sailed past every one of them.
        expect(rendered).not.toMatch(/summar/i);
    });

    it("renders a suppressed sentence exactly like one that never existed", () => {
        // Suppression strips the sentence server-side and leaves the record otherwise intact, so
        // what arrives is a record with no summary — the same shape as a save that never qualified,
        // one whose job failed, and one the sweeper reclaimed. All four fall back to the field-name
        // description, which is what the timeline showed before summaries existed.
        const failed = renderState([
            record({ id: "r", changeset: [{ path: "body", label: "Body" }], summaryPending: false })
        ]);
        const failedText = failed.text();
        failed.unmount();

        const never = renderState([
            record({ id: "r", changeset: [{ path: "body", label: "Body" }] })
        ]);

        expect(never.text()).toBe(failedText);
    });

    it("leaves a row holding two runs describing itself", () => {
        // A row collapses on an hour; a summary is debounced on a minute. Putting one sentence on
        // a row that holds two would attribute it to saves it never covered.
        const { text } = renderState([
            record({
                timestamp: at(50),
                changeset: [{ path: "body", label: "Body" }],
                summary: SENTENCE
            }),
            record({
                timestamp: at(10),
                changeset: [{ path: "title", label: "Title" }],
                summary: "Reworded the page title."
            })
        ]);

        expect(text()).not.toContain(SENTENCE);
        expect(text()).toContain("made 2 saves");

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        // Both of them, once it is open.
        expect(text()).toContain(SENTENCE);
        expect(text()).toContain("Reworded the page title.");
    });
});

describe("non-human activity", () => {
    it("keeps the person's name on a scheduled write and says what ran", () => {
        // The design's hardest attribution case: the person's name is right, and they were not
        // there. Both facts have to be on the row.
        const { text } = renderState([
            record({ action: "entry.publish", source: "task:cmsEntriesScheduledPublish" })
        ]);

        expect(text()).toContain("Ada Editor");
        expect(text()).toContain("Automated");
        expect(text()).toContain("background task");
    });

    it("reads an API-key write as a machine", () => {
        const { text } = renderState([
            record({
                source: "api-key",
                actor: { id: "key-1", type: "api-key", displayName: "content-sync" },
                changeset: [{ path: "slug", label: "Slug" }]
            })
        ]);

        expect(text()).toContain("content-sync");
        expect(text()).toContain("API key");
    });
});

describe("states around loading and failure", () => {
    it("renders while loading without throwing", () => {
        expect(() => renderState([], { loading: true })).not.toThrow();
    });

    it("says what failed rather than rendering an empty timeline", () => {
        // An error rendered as "no activity" would be indistinguishable from a pre-feature entry.
        const { text } = renderState([], { error: "network down" });

        expect(text()).toContain("Could not load activity");
        expect(text()).not.toContain("no record of this entry");
    });
});

describe("collapsing, as the reader sees it", () => {
    it("shows one row with a count for a run of saves by one person", () => {
        const { text } = renderState([
            record({ timestamp: "2026-09-10T10:20:00.000Z" }),
            record({ timestamp: "2026-09-10T10:15:00.000Z" }),
            record({ timestamp: "2026-09-10T10:10:00.000Z" })
        ]);

        // The save count leads, because "6 fields across 4 saves" and "6 fields in one save" are
        // different editorial events.
        expect(text()).toContain("made 3 saves");
    });

    it("does not merge two redacted actors into one row", () => {
        // Merging them would assert they were the same person, which is exactly what the
        // redaction withholds. A later refactor that "simplifies" the collapse rule breaks here.
        const redacted = { id: "", type: "", displayName: "" };
        const { text } = renderState([
            record({ timestamp: "2026-09-10T10:20:00.000Z", actor: redacted }),
            record({ timestamp: "2026-09-10T10:15:00.000Z", actor: redacted })
        ]);

        expect(text()).not.toContain("made 2 saves");
        // Two rows, plus the revision header's own list of who was involved.
        expect(screen.getAllByText("Someone").length).toBeGreaterThanOrEqual(2);
    });
});

describe("the generated marker is defined once", () => {
    // A source guard rather than a behavioural one, because the failure it catches is a second
    // definition appearing somewhere the behavioural tests do not happen to render.
    //
    // A sentence shows in two places — the collapsed row's header and the run heading inside the
    // expansion — and both go through `SummaryLine`. Two literals would drift the moment one was
    // edited, and the distinction the marker carries is the only thing separating an exact
    // statement from an interpretive one now that both tiers quote values.
    const source = readFileSync(
        join(import.meta.dirname, "../src/components/ActivityTimeline.tsx"),
        "utf8"
    );

    it("appears exactly once in the component that renders sentences", () => {
        expect(source.match(/AI-generated/g) ?? []).toHaveLength(1);
    });

    it("sits behind the provenance flag and nothing else", () => {
        // Keyed on what wrote the sentence, never on whether there is one. The mark takes an
        // optional sentence now — the run renders its gutter whether or not it has one to mark —
        // so the flag is read through it.
        expect(source).toMatch(/summary\?\.generated \?/);
    });
});

describe("every line under an actor's name starts at the same edge", () => {
    /**
     * Structural rather than the usual text assertion, and deliberately so.
     *
     * A row carries one of three things under the name — the sentence for its run, the placeholder
     * while one is coming, or the fields it touched when it holds several runs — and which one it
     * gets is an accident of how the entry was saved rather than anything the reader chose. So all
     * three have to begin at the same x, or a timeline of mixed rows reads as ragged.
     *
     * That edge is the actor's name, so none of the three may be wrapped in anything that indents
     * it. The design puts the sentence in a 16px gutter and pads the other two by 20px to match;
     * built that way it read as indented too far in the running panel, so the gutter is gone and
     * the AI mark trails its sentence instead.
     *
     * Three branches have drifted apart twice already — eight pixels on the saves inside an
     * expansion, twenty on the fields line — and both times one wrong class in one branch survived
     * the whole suite and was found by measuring the running app.
     */
    const indenters = /pl-|ps-|pr-xxl|grid-cols-\[16px/;

    /** Every class on the way up to the row, which is where the row's own padding starts. */
    const wrappersAbove = (node: Element | null) => {
        const classes: string[] = [];
        let current: Element | null = node;

        while (current && current !== document.body) {
            const className = current.className;
            if (typeof className === "string") {
                if (className.includes("group-item")) {
                    break;
                }
                classes.push(className);
            }
            current = current.parentElement;
        }

        return classes;
    };

    const isFlush = (node: Element | null) =>
        wrappersAbove(node).every(className => !indenters.test(className));

    it("does not indent a row's sentence", () => {
        renderState([
            record({
                changeset: [{ path: "title", label: "Title" }],
                summary: "Changed Title from \u201cOld\u201d to \u201cNew\u201d."
            })
        ]);

        expect(isFlush(screen.getByText(/Changed/))).toBe(true);
    });

    it("does not indent the placeholder, so a row does not shift when its sentence lands", () => {
        // The one case a reader watches change in place: the row renders pending, then re-renders
        // with a sentence. A placeholder at a different indent makes that a jump.
        renderState([
            record({ changeset: [{ path: "body", label: "Body" }], summaryPending: true })
        ]);

        expect(isFlush(screen.getByText(/Summarising/))).toBe(true);
    });

    it("does not indent the fields line, which is the line that was twenty pixels out", () => {
        renderState([
            record({
                changeset: [
                    { path: "sku", label: "SKU" },
                    { path: "price", label: "Price" }
                ]
            })
        ]);

        expect(isFlush(screen.getByText("SKU and Price"))).toBe(true);
    });

    it("keeps the mark inside the sentence rather than beside it", () => {
        // Trailing is what lets a generated sentence start at the same edge as an exact one. A
        // mark returned to its own gutter cell would indent every sentence again, and the three
        // tests above would still pass because none of them renders a generated sentence.
        renderState([
            record({
                changeset: [{ path: "body", label: "Body" }],
                summary: "Rewrote Body.",
                summaryKind: "ai"
            })
        ]);

        // `Icon` renders its label as visually-hidden text, so the mark being *inside* the
        // sentence element is exactly what this reads.
        const sentence = screen.getByText(/Rewrote/);

        expect(sentence.textContent).toContain("AI-generated");
    });
});

describe("a save's fields sit on the clock's line", () => {
    /**
     * The gap above a run's saves exists to separate them from what the run said about itself, so
     * a run that said nothing must not have it.
     *
     * A row mapping onto a single run states that run's sentence in its own header and leaves the
     * run inside the expansion silent — and there the gap had nothing to separate, so it pushed
     * the first chip four pixels below the clock beside it. The clock's alignment is tuned to a
     * 19px sentence line, which is right in every run that has one.
     */
    const spacersAbove = (node: Element | null) => {
        const classes: string[] = [];
        let current: Element | null = node;

        while (current && current !== document.body) {
            const className = current.className;
            if (typeof className === "string") {
                if (className.includes("grid-cols-[52px_1fr]")) {
                    break;
                }
                classes.push(className);
            }
            current = current.parentElement;
        }

        return classes;
    };

    const sitsOnTheClocksLine = (node: Element | null) =>
        spacersAbove(node).every(className => !/(^|\s)(mt-|pt-)/.test(className));

    it("does not push the fields down when the run says nothing", () => {
        // A single-run row: the header carries the sentence, so the run inside has none.
        // The sentence deliberately does not name the field: it is bolded inside the sentence as
        // well as being the chip, and a query for it would find either.
        renderState([
            record({
                changeset: [{ path: "price", label: "Price" }],
                summary: "Adjusted the listing.",
                summaryKind: "deterministic"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /Adjusted the listing/ }));

        expect(sitsOnTheClocksLine(screen.getByText("Price"))).toBe(true);
    });

    it("keeps the gap where the run does say something", () => {
        // Two runs, so each states its own sentence inside the expansion and the saves below it
        // need separating from it again.
        renderState([
            record({
                id: "a",
                timestamp: "2026-09-10T10:30:00.000Z",
                changeset: [{ path: "alpha", label: "Alpha" }],
                summary: "Reworked the first run.",
                summaryKind: "ai"
            }),
            record({
                id: "b",
                timestamp: "2026-09-10T10:20:00.000Z",
                changeset: [{ path: "beta", label: "Beta" }],
                summary: "A different run entirely.",
                summaryKind: "ai"
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /made 2 saves/ }));

        expect(sitsOnTheClocksLine(screen.getByText("Alpha"))).toBe(false);
    });
});

describe("the filter panel opens where the reader is looking", () => {
    /**
     * A regression guard for a bug that looked like a console warning.
     *
     * `Popover` hands its trigger straight to Radix with `asChild`, and Radix anchors the panel off
     * a ref to a real DOM node. Every admin-ui component is wrapped by `makeDecoratable`, which is
     * a plain function component, so passing one directly drops the ref — React says so ("Function
     * components cannot be given refs") and Radix, with no anchor to measure, lays the panel out at
     * the viewport origin. Measured in the running admin before the fix: open, populated, and at
     * left 0, top -340. Entirely off screen.
     *
     * Nothing about that reads as broken from the outside. The button responds, the panel mounts,
     * `data-state` goes to `open` — the filters are just somewhere nobody can see. So the guard is
     * on the one structural difference: which node Radix ends up holding.
     *
     * A proxy rather than the real property, which is "Radix can measure this node" and is not
     * something jsdom can answer. `Tooltip` in the design system wraps its own trigger in a span
     * for exactly this reason, so the span is the house convention as well as the fix.
     */
    it("gives Radix a real element to anchor the panel to", () => {
        renderState([record({ changeset: [{ path: "title", label: "Title" }] })]);

        const trigger = document.querySelector('[data-slot="popover-trigger"]');

        // A BUTTON here means the slot landed on `IconButton`'s own element and the ref was
        // dropped on the way — which is the broken arrangement, not the fixed one.
        expect(trigger).not.toBeNull();
        expect(trigger!.tagName).toBe("SPAN");
        expect(trigger!.querySelector('[aria-label="Filter activity"]')).not.toBeNull();
    });
});
