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

describe("the eight states", () => {
    it("1. the grouped timeline names each revision it groups under", () => {
        const { text } = renderState([
            record({ revision: "abc#0002", timestamp: "2026-09-10T10:00:00.000Z" }),
            record({ revision: "abc#0001", timestamp: "2026-09-09T10:00:00.000Z" })
        ]);

        expect(text()).toContain("Revision 2");
        expect(text()).toContain("Revision 1");
    });

    it("2. an expanded save discloses the changed fields, and only once expanded", () => {
        const { text } = renderState([
            record({
                changeset: [
                    { path: "title", label: "Title" },
                    { path: "body", label: "Body" }
                ]
            })
        ]);

        // Closed: how much changed, not what.
        expect(text()).not.toContain("Title");
        expect(text()).toContain("edited 2 fields");

        fireEvent.click(screen.getByRole("button", { name: /edited 2 fields/ }));

        expect(text()).toContain("Title");
        expect(text()).toContain("Body");
    });

    it("2b. an expanded save says values are not recorded", () => {
        // Stated rather than left as an empty space, which would read as a bug.
        const { text } = renderState([record({ changeset: [{ path: "title", label: "Title" }] })]);

        fireEvent.click(screen.getByRole("button", { name: /edited 1 field/ }));

        expect(text()).toContain("Values from this save are not recorded");
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
        expect(text()).toContain("Step approved");
        expect(text()).toContain("Legal review");
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
        fireEvent.click(screen.getByRole("button", { name: /edited 1 field/ }));
        expect(positional.text()).toContain("item 3");

        positional.unmount();

        const identified = renderState([
            record({ changeset: [{ path: "sections#a1b2c3.title", label: "Title" }] })
        ]);
        fireEvent.click(screen.getByRole("button", { name: /edited 1 field/ }));
        expect(identified.text()).not.toContain("item ");
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

describe("the route to compare", () => {
    it("offers compare at the revision boundary and admits what it cannot show", () => {
        // The honesty problem the design named: a reader looking at Tuesday's save wants to see
        // Tuesday, and that state no longer exists anywhere.
        const { text } = renderState([record()]);

        expect(text()).toContain("Compare revisions");
        expect(text()).toContain("not comparable");
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
