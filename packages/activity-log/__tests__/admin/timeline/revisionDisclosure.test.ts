import { describe, expect, it } from "vitest";
import {
    defaultOpenRevisions,
    emptyFilteredHint,
    isRevisionOpen,
    type DisclosableRevision
} from "~/admin/timeline/revisionDisclosure.js";

const group = (revision: string, isCurrent = false): DisclosableRevision => ({
    revision,
    isCurrent
});

/** Newest first, which is the order `groupByRevision` hands them over in. */
const history = (): DisclosableRevision[] => [
    group("abc#0004"),
    group("abc#0003", true),
    group("abc#0002"),
    group("abc#0001")
];

describe("defaultOpenRevisions", () => {
    it("opens the current revision and nothing else", () => {
        const open = defaultOpenRevisions(history(), false);

        expect([...open]).toEqual(["abc#0003"]);
    });

    it("opens the newest revision when none is current", () => {
        // `isCurrent` comes from the entry form, so it is absent while the form is still loading
        // and can miss entirely for a revision that has activity but no longer exists. Falling
        // through to nothing would leave a panel of headers with no way to tell it had loaded.
        const open = defaultOpenRevisions(
            [group("abc#0004"), group("abc#0003"), group("abc#0002")],
            false
        );

        expect([...open]).toEqual(["abc#0004"]);
    });

    it("opens every revision while a filter is narrowing the timeline", () => {
        const open = defaultOpenRevisions(history(), true);

        expect([...open]).toEqual(["abc#0004", "abc#0003", "abc#0002", "abc#0001"]);
    });

    it("opens nothing when there is nothing to open", () => {
        expect([...defaultOpenRevisions([], false)]).toEqual([]);
        expect([...defaultOpenRevisions([], true)]).toEqual([]);
    });
});

describe("isRevisionOpen", () => {
    it("follows the default until the reader chooses otherwise", () => {
        const defaults = defaultOpenRevisions(history(), false);

        expect(isRevisionOpen("abc#0003", {}, defaults)).toBe(true);
        expect(isRevisionOpen("abc#0001", {}, defaults)).toBe(false);
    });

    it("lets a choice override the default in both directions", () => {
        const defaults = defaultOpenRevisions(history(), false);

        expect(isRevisionOpen("abc#0003", { "abc#0003": false }, defaults)).toBe(false);
        expect(isRevisionOpen("abc#0001", { "abc#0001": true }, defaults)).toBe(true);
    });

    it("leaves a revision it has no choice for on the default", () => {
        // The case this exists for: a refresh brings back a revision nobody has clicked. Reading
        // it off a neighbour's state, or off "has anything been clicked yet", would open a new
        // revision's worth of rows the reader never asked for.
        const defaults = defaultOpenRevisions(history(), false);
        const overrides = { "abc#0004": true, "abc#0002": true };

        expect(isRevisionOpen("abc#0001", overrides, defaults)).toBe(false);
        expect(isRevisionOpen("abc#0003", overrides, defaults)).toBe(true);
    });
});

describe("emptyFilteredHint", () => {
    it("names the dropdowns when the filter bar is open", () => {
        expect(emptyFilteredHint(true)).toBe(
            "Set either dropdown back to All to widen the timeline."
        );
    });

    it("sends the reader to the bar first when it is shut", () => {
        // The design wrote one line, for a bar that is open. Told to set a dropdown back to All
        // with the bar collapsed, a reader is being pointed at two controls that are not on the
        // screen — the filter button is, and it carries the count for exactly this reason.
        expect(emptyFilteredHint(false)).toContain("Open the filter bar");
    });

    it("never offers to clear the filters", () => {
        // The redesign replaced the global clear with a cross on each dropdown. This state kept
        // offering a "Clear filters" button long after the control it named had gone.
        expect(emptyFilteredHint(true).toLowerCase()).not.toContain("clear");
        expect(emptyFilteredHint(false).toLowerCase()).not.toContain("clear");
    });
});
