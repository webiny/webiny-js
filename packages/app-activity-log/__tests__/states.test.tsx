import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
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
        loading?: boolean;
        error?: string | null;
    } = {}
) => {
    const filters = options.filters ?? {};
    const hasMore = options.hasMore ?? false;

    const rendered = render(
        <AdminUiProvider>
            <ActivityTimelineView
                view={buildTimelineView({ records, filters, hasMore })}
                loading={options.loading ?? false}
                loadingMore={false}
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
        expect(text()).toContain("2 fields changed");

        fireEvent.click(screen.getByRole("button", { name: /fields changed/ }));

        expect(text()).toContain("Title");
        expect(text()).toContain("Body");
    });

    it("2b. an expanded save says values are not recorded", () => {
        // Stated rather than left as an empty space, which would read as a bug.
        const { text } = renderState([record({ changeset: [{ path: "title", label: "Title" }] })]);

        fireEvent.click(screen.getByRole("button", { name: /field changed/ }));

        expect(text()).toContain("Values are not recorded");
    });

    it("3. structural changes name the operation", () => {
        const { text } = renderState([
            record({
                changeset: [
                    { path: "sections#a1b2c3d4e5f6", label: "Sections", operation: "added" }
                ]
            })
        ]);

        fireEvent.click(screen.getByRole("button", { name: /field changed/ }));

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

        expect(text()).toContain("Review step approved");
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

        expect(text()).toContain("Saved ×3");
    });

    it("does not merge two redacted actors into one row", () => {
        // Merging them would assert they were the same person, which is exactly what the
        // redaction withholds. A later refactor that "simplifies" the collapse rule breaks here.
        const redacted = { id: "", type: "", displayName: "" };
        const { text } = renderState([
            record({ timestamp: "2026-09-10T10:20:00.000Z", actor: redacted }),
            record({ timestamp: "2026-09-10T10:15:00.000Z", actor: redacted })
        ]);

        expect(text()).not.toContain("Saved ×2");
        expect(screen.getAllByText("Someone")).toHaveLength(2);
    });
});
