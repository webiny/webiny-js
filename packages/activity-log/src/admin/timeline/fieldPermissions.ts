import { splitPathSegments } from "~/shared/index.js";
import type { TimelineRecord } from "./types.js";

/**
 * Withholding what a reader has no access to, on the side the product currently enforces on.
 *
 * Field permissions are authored per field in the model editor and stored as rules on the field.
 * Today the CMS evaluates them in the browser and nowhere else — the API stores and validates the
 * rules but no read path consults them — so this does the same, and moves to the API when the
 * product's own enforcement does. `ActivitySummaryVisibility` and `ActivityChangesetFilter` are
 * already the seams for that, and this becomes a decorator over them rather than a rewrite.
 *
 * **What that means, said plainly: this is presentation, not access control.** The values are on
 * the wire before this runs. It is worth having anyway — it keeps the timeline consistent with the
 * form beside it, which is where a reader would otherwise notice the difference — but it protects
 * nobody who opens the network tab, and it must not be described as though it does.
 *
 * Only "No Access" counts. The editor offers two levels, and they are not the same question:
 * `hide` means the reader may not see the field, and `disable` means they may read it but not edit
 * it. A summary quoting a read-only field discloses nothing the entry does not already show.
 */

/** The rule shape the model editor writes, reduced to what this decision reads. */
export interface FieldAccessRule {
    type: string;
    action: string;
    [key: string]: unknown;
}

/** A model field, reduced the same way. Nested containers carry their own fields. */
export interface PermissionedField {
    fieldId: string;
    rules?: FieldAccessRule[] | null;
    fields?: PermissionedField[] | null;
    settings?: {
        fields?: PermissionedField[] | null;
        templates?: { fields?: PermissionedField[] | null }[] | null;
    } | null;
}

/**
 * Every field this reader has no access to, by `fieldId`.
 *
 * `matches` is injected rather than imported: deciding whether a rule applies to the current
 * identity is the CMS's judgement, not this feature's, and the moment this package makes that call
 * itself it owns a second implementation of field permissions that can disagree with the form's.
 */
export const hiddenFieldIds = (
    fields: PermissionedField[],
    matches: (rule: FieldAccessRule) => boolean
): Set<string> => {
    const hidden = new Set<string>();

    const walk = (current: PermissionedField[]) => {
        for (const field of current) {
            const denies = (field.rules ?? []).some(
                rule => rule.type === "accessControl" && rule.action === "hide" && matches(rule)
            );

            if (denies) {
                hidden.add(field.fieldId);
            }

            // A container's children are independently permissioned, and a container the reader
            // may not see says nothing about them — so the walk continues either way.
            walk(field.fields ?? []);
            walk(field.settings?.fields ?? []);

            for (const template of field.settings?.templates ?? []) {
                walk(template.fields ?? []);
            }
        }
    };

    walk(fields);

    return hidden;
};

/** Whether a changeset path names a field the reader has no access to. */
const touchesHidden = (path: string, hidden: Set<string>): boolean =>
    splitPathSegments(path).some(segment => hidden.has(segment));

/**
 * What a record looks like to a reader who may not see some of the fields it touched.
 *
 * Two different withholdings, because they answer different questions.
 *
 * **The summary goes entirely** when the record touched a hidden field. It is one sentence about
 * the whole save and there is no way to remove a field from the middle of it — a generated one is
 * prose, and even a rendered one reads as a single statement. Per record is also the granularity
 * the API hook already works at, so the two agree when enforcement moves.
 *
 * **The changeset loses only the hidden paths**, and the count of what went stays on the record.
 * Dropping them silently would turn "edited 3 fields" into "edited 1 field" and then into "saved
 * without changing any field" — a timeline that lies about how much happened is worse than one
 * that admits it is not showing everything. The row keeps its actor, its time and its place in
 * history either way: a record is never removed.
 */
export const applyFieldPermissions = (
    records: TimelineRecord[],
    hidden: Set<string>
): TimelineRecord[] => {
    if (hidden.size === 0) {
        return records;
    }

    return records.map(record => {
        const visible = record.changeset.filter(change => !touchesHidden(change.path, hidden));

        if (visible.length === record.changeset.length) {
            return record;
        }

        const {
            summary: _summary,
            summaryKind: _summaryKind,
            summaryPending: _summaryPending,
            ...rest
        } = record;

        return {
            ...rest,
            changeset: visible,
            // Same field as the changeset cap uses, and for the same reason: the row stands for
            // more changes than it lists, so it must not read as complete.
            truncated: true,
            hiddenFieldCount:
                (record.hiddenFieldCount ?? 0) + (record.changeset.length - visible.length)
        };
    });
};
