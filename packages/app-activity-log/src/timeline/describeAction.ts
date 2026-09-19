import type { TimelineItem } from "./collapseConsecutive.js";

export type ActionBadgeTone = "success" | "warning" | "destructive" | "neutral";

export interface ActionBadge {
    label: string;
    tone: ActionBadgeTone;
}

export interface DescribedAction {
    /**
     * A sentence that completes "<who> …", so a row reads as editorial history rather than as a
     * log line. "edited 3 fields", not "ENTRY_UPDATE (3)".
     */
    sentence: string;
    /**
     * A short badge for actions whose *outcome* matters more than the verb — publishing state, a
     * new revision, a deletion. Absent for an ordinary save, where a badge would be noise on
     * nearly every row.
     */
    badge: ActionBadge | null;
}

/**
 * Structural operations, counted so a block change reads as one editorial action.
 *
 * Adding a block with twelve fields inside it is one thing a person did, and the recorder already
 * reports it as one changeset entry at block level rather than twelve. This is the reading half of
 * that decision: the sentence names the operation instead of a field count.
 */
const countOperations = (item: TimelineItem) => {
    const counts = { added: 0, removed: 0, moved: 0, replaced: 0, edited: 0 };

    for (const change of item.changeset) {
        switch (change.operation) {
            case "added":
                counts.added++;
                break;
            case "removed":
                counts.removed++;
                break;
            case "moved":
                counts.moved++;
                break;
            case "replaced":
                counts.replaced++;
                break;
            default:
                counts.edited++;
        }
    }

    return counts;
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
    `${count} ${count === 1 ? singular : pluralForm}`;

/**
 * Only the dominant operation names the sentence.
 *
 * A save that both moved a block and edited a field is described by whichever there is more of,
 * with the field list left to say the rest. Trying to name every operation in one sentence
 * produces "added a block, moved 2 blocks and edited 4 fields", which is longer than the list it
 * summarises and therefore pointless.
 */
const describeSave = (item: TimelineItem): string => {
    const counts = countOperations(item);
    const structural = counts.added + counts.removed + counts.moved + counts.replaced;

    if (item.changeset.length === 0) {
        // A save that changed no field value at all. Honest rather than silent: an empty changeset
        // is what a no-op save looks like, and saying "edited 0 fields" would read as a bug.
        return "saved without changing any field";
    }

    if (structural > 0 && structural >= counts.edited) {
        if (counts.moved === structural) {
            return counts.moved === 1 ? "moved a block" : `reordered ${counts.moved} blocks`;
        }
        if (counts.added === structural) {
            return counts.added === 1 ? "added a block" : `added ${counts.added} blocks`;
        }
        if (counts.removed === structural) {
            return counts.removed === 1 ? "removed a block" : `removed ${counts.removed} blocks`;
        }
        if (counts.replaced === structural) {
            return counts.replaced === 1
                ? "replaced a block"
                : `replaced ${counts.replaced} blocks`;
        }

        return `changed ${plural(structural, "block")}`;
    }

    return `edited ${plural(item.changeset.length, "field")}`;
};

const REVIEW_SENTENCES: Record<string, string> = {
    "review.submitted": "submitted this for review",
    "review.step.started": "started a review step",
    "review.step.approved": "approved a review step",
    "review.step.rejected": "rejected a review step",
    "review.step.takenOver": "took over a review step",
    "review.cancelled": "cancelled the review",
    "review.approved": "approved this for publishing",
    "review.rejected": "rejected this for publishing",
    "review.deleted": "deleted the review"
};

const ENTRY_SENTENCES: Record<string, string> = {
    "entry.create": "created this entry",
    "entry.revision.create": "created this revision",
    "entry.revision.delete": "deleted a revision",
    "entry.revision.describe": "described this revision",
    "entry.publish": "published this revision",
    "entry.unpublish": "unpublished this revision",
    "entry.republish": "republished this revision",
    "entry.move": "moved this entry to another folder",
    "entry.trash": "moved this entry to the bin",
    "entry.restore": "restored this entry from the bin",
    "entry.delete": "deleted this entry permanently"
};

const BADGES: Record<string, ActionBadge> = {
    "entry.create": { label: "Created", tone: "neutral" },
    "entry.revision.create": { label: "New revision", tone: "neutral" },
    "entry.revision.delete": { label: "Revision deleted", tone: "destructive" },
    "entry.publish": { label: "Published", tone: "success" },
    "entry.republish": { label: "Published", tone: "success" },
    "entry.unpublish": { label: "Unpublished", tone: "warning" },
    "entry.trash": { label: "In the bin", tone: "warning" },
    "entry.restore": { label: "Restored", tone: "neutral" },
    "entry.delete": { label: "Deleted", tone: "destructive" },
    "review.approved": { label: "Approved", tone: "success" },
    "review.rejected": { label: "Rejected", tone: "destructive" },
    "review.step.approved": { label: "Step approved", tone: "success" },
    "review.step.rejected": { label: "Step rejected", tone: "destructive" }
};

/**
 * How one row describes what happened.
 *
 * Kept out of the components because it is the whole of the feature's tone: the audience is a
 * content editor, not a developer, and the difference between "edited 3 fields" and
 * "entry.update · 3" is the difference between editorial history and a system log. A design pass
 * that replaces every component keeps this.
 *
 * An unrecognised action falls back to the raw action string rather than to something invented, so
 * a new action added on the API side shows up as itself instead of silently reading as a save.
 */
export const describeAction = (item: TimelineItem): DescribedAction => {
    const action = item.latest.action;
    const occurrences = item.records.length;

    if (action === "entry.update") {
        if (occurrences > 1) {
            // A collapsed run of saves. The count of saves leads, because "6 fields across 4
            // saves" and "6 fields in one save" are different editorial events.
            return {
                sentence: `made ${plural(occurrences, "save")}, editing ${plural(
                    item.changeset.length,
                    "field"
                )}`,
                badge: null
            };
        }

        return { sentence: describeSave(item), badge: null };
    }

    const sentence = ENTRY_SENTENCES[action] ?? REVIEW_SENTENCES[action] ?? action;

    return { sentence, badge: BADGES[action] ?? null };
};
