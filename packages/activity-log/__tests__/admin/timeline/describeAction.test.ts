import { describe, expect, it } from "vitest";
import { collapseConsecutive } from "~/admin/timeline/collapseConsecutive.js";
import { describeAction } from "~/admin/timeline/describeAction.js";
import type { TimelineChange, TimelineRecord } from "~/admin/timeline/types.js";

/**
 * The sentence a row reads as.
 *
 * This is the design's tone requirement, made testable: the audience is a content editor, and the
 * difference between "added a block" and "entry.update · 1" is the difference between editorial
 * history and a system log.
 */

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

/** One row, built the way the timeline builds it. */
const row = (overrides: Partial<TimelineRecord> = {}) =>
    collapseConsecutive([record(overrides)])[0]!;

const change = (label: string, operation?: string): TimelineChange => ({
    path: label.toLowerCase(),
    label,
    ...(operation === undefined ? {} : { operation })
});

describe("ordinary saves", () => {
    it("counts the fields", () => {
        const action = describeAction(row({ changeset: [change("Title"), change("Body")] }));

        expect(action.sentence).toBe("edited 2 fields");
        expect(action.badge).toBeNull();
    });

    it("names the field when only one changed", () => {
        // "edited 1 field" costs a reader a click to learn something the row already knows. The
        // overwhelming majority of saves never qualify for a generated summary, so this sentence
        // is the whole of what they get.
        expect(describeAction(row({ changeset: [change("Title")] })).sentence).toBe("edited Title");
    });

    it("counts rather than names when the changeset was truncated", () => {
        // The single entry is then a parent standing in for more changes than the record lists.
        // Naming it as the field that changed would be a plain lie.
        const item = row({ changeset: [change("Sections")], truncated: true });

        expect(describeAction(item).sentence).toBe("edited 1 field");
    });

    it("names the field by its captured label, not its path", () => {
        const item = row({
            changeset: [{ path: "hero.heroHeadline", label: "Headline", operation: null }]
        });

        expect(describeAction(item).sentence).toBe("edited Headline");
    });

    it("falls back to the path when a label was never captured", () => {
        const item = row({
            changeset: [{ path: "hero.heroHeadline", label: "", operation: null }]
        });

        expect(describeAction(item).sentence).toBe("edited Hero headline");
    });

    it("says a save changed nothing rather than reporting zero fields", () => {
        // An empty changeset is what a no-op save looks like, and it is also the reason no stored
        // hash is needed to recognise one. "edited 0 fields" would read as a bug.
        expect(describeAction(row({ changeset: [] })).sentence).toBe(
            "saved without changing any field"
        );
    });
});

describe("structural changes", () => {
    it("names an added block instead of counting fields", () => {
        // The whole point of reporting a block change at block level: adding a block with twelve
        // fields inside it is one editorial action.
        const action = describeAction(row({ changeset: [change("CTA banner", "added")] }));

        expect(action.sentence).toBe("added a block");
    });

    it("names a removed block", () => {
        expect(describeAction(row({ changeset: [change("Newsletter", "removed")] })).sentence).toBe(
            "removed a block"
        );
    });

    it("distinguishes one move from a reorder", () => {
        expect(describeAction(row({ changeset: [change("Grid", "moved")] })).sentence).toBe(
            "moved a block"
        );

        expect(
            describeAction(
                row({
                    changeset: [change("A", "moved"), change("B", "moved"), change("C", "moved")]
                })
            ).sentence
        ).toBe("reordered 3 blocks");
    });

    it("lets the dominant operation name the sentence", () => {
        // A save that both moved a block and edited a field is described by whichever there is
        // more of. Naming every operation produces a sentence longer than the list it summarises.
        const structural = describeAction(
            row({ changeset: [change("A", "moved"), change("B", "moved"), change("Title")] })
        );
        const editorial = describeAction(
            row({
                changeset: [change("A", "moved"), change("Title"), change("Body"), change("Slug")]
            })
        );

        expect(structural.sentence).toBe("reordered 2 blocks");
        expect(editorial.sentence).toBe("edited 4 fields");
    });

    it("falls back to a count when operations are mixed", () => {
        const action = describeAction(
            row({ changeset: [change("A", "added"), change("B", "removed")] })
        );

        expect(action.sentence).toBe("changed 2 blocks");
    });
});

describe("collapsed runs of saves", () => {
    it("leads with the number of saves", () => {
        const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes)).toISOString();
        const item = collapseConsecutive([
            record({ timestamp: at(20), changeset: [change("Title")] }),
            record({ timestamp: at(15), changeset: [change("Body")] })
        ])[0]!;

        expect(describeAction(item).sentence).toBe("made 2 saves, editing 2 fields");
    });

    it("names the field when a whole run touched only one", () => {
        // Several saves to the same field is the commonest shape of a run, and the one a generated
        // summary is least likely to cover — one short field is not enough prose to summarise.
        const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes)).toISOString();
        const item = collapseConsecutive([
            record({ timestamp: at(20), changeset: [change("Title")] }),
            record({ timestamp: at(15), changeset: [change("Title")] })
        ])[0]!;

        expect(describeAction(item).sentence).toBe("made 2 saves, editing Title");
    });

    it("counts rather than names when a run was truncated", () => {
        const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes)).toISOString();
        const item = collapseConsecutive([
            record({ timestamp: at(20), changeset: [change("Sections")], truncated: true }),
            record({ timestamp: at(15), changeset: [change("Sections")] })
        ])[0]!;

        expect(describeAction(item).sentence).toBe("made 2 saves, editing 1 field");
    });

    it("counts rather than names when the one change was structural", () => {
        // A run whose only change is a moved block. "editing Sections" would describe it as an
        // edit to a field, which is the one thing it was not.
        const at = (minutes: number) => new Date(Date.UTC(2026, 8, 10, 10, minutes)).toISOString();
        const item = collapseConsecutive([
            record({ timestamp: at(20), changeset: [change("Sections", "moved")] }),
            record({ timestamp: at(15), changeset: [change("Sections", "moved")] })
        ])[0]!;

        expect(describeAction(item).sentence).toBe("made 2 saves, editing 1 field");
    });
});

describe("lifecycle actions", () => {
    it.each([
        ["entry.create", "created this entry", "Created"],
        ["entry.revision.create", "created this revision", "New revision"],
        ["entry.publish", "published this revision", "Published"],
        ["entry.unpublish", "unpublished this revision", "Unpublished"],
        ["entry.trash", "moved this entry to the bin", "In the bin"],
        ["entry.restore", "restored this entry from the bin", "Restored"]
    ])("describes %s", (action, sentence, badge) => {
        const described = describeAction(row({ action }));

        expect(described.sentence).toBe(sentence);
        expect(described.badge?.label).toBe(badge);
    });

    it("marks publishing green and deletion red, because the outcomes read differently", () => {
        expect(describeAction(row({ action: "entry.publish" })).badge?.tone).toBe("success");
        expect(describeAction(row({ action: "entry.delete" })).badge?.tone).toBe("destructive");
        expect(describeAction(row({ action: "entry.unpublish" })).badge?.tone).toBe("warning");
    });
});

describe("review actions", () => {
    it("reads as something a person did", () => {
        expect(describeAction(row({ action: "review.step.approved" })).sentence).toBe(
            "approved a review step"
        );
        expect(describeAction(row({ action: "review.submitted" })).sentence).toBe(
            "submitted this for review"
        );
    });
});

describe("an action nobody has described yet", () => {
    it("shows itself rather than reading as a save", () => {
        // A new action added on the API side must not silently render as an ordinary edit.
        const action = describeAction(row({ action: "entry.somethingNew" }));

        expect(action.sentence).toBe("entry.somethingNew");
        expect(action.badge).toBeNull();
    });
});
