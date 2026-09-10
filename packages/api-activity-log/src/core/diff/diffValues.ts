import type { ChangesetEntry } from "~/core/types.js";
import { encodePath, fieldSegment, listItemSegment, type PathSegment } from "~/core/paths.js";
import { childFieldsFor, templateIdOf, type FieldDescriptor } from "./descriptors.js";
import { contentHash } from "./contentHash.js";
import { matchItems } from "./matchItems.js";
import { DEFAULT_MAX_ENTRIES, rollUp, type RollUpResult } from "./rollUp.js";

export interface DiffOptions {
    /** Changes beyond this many are rolled up to a common parent. */
    maxEntries?: number;
}

type Values = Record<string, unknown> | undefined | null;

const asArray = (value: unknown): unknown[] => {
    return Array.isArray(value) ? value : [];
};

const isContainer = (value: unknown): value is Record<string, unknown> => {
    return (
        value !== null &&
        typeof value !== "undefined" &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date)
    );
};

/**
 * Compares two value trees and reports which paths changed.
 *
 * Never reports a value, in any form. A caller gets paths, labels and structural operations.
 *
 * Two properties are worth stating because the rest of the algorithm follows from them:
 *
 *   - **Nothing is descended into unnecessarily.** Every field and every item is short-circuited
 *     on a content hash first, so the cost of a diff tracks what changed rather than the size of
 *     the entry.
 *   - **Structural changes are reported at block level.** An added, removed or replaced block is
 *     one entry, not one entry per field inside it. A *moved* block is the exception: it exists on
 *     both sides, so its move is reported and its contents are still compared — dragging a block
 *     and editing it in the same save is two things that happened, and a reader wants both.
 */
export const diffValues = (
    fields: FieldDescriptor[],
    before: Values,
    after: Values,
    options: DiffOptions = {}
): RollUpResult => {
    const entries: ChangesetEntry[] = [];

    diffFields(fields, before ?? {}, after ?? {}, [], entries);

    return rollUp(entries, fields, options.maxEntries ?? DEFAULT_MAX_ENTRIES);
};

const diffFields = (
    fields: FieldDescriptor[],
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    basePath: PathSegment[],
    out: ChangesetEntry[]
): void => {
    for (const field of fields) {
        diffField(
            field,
            before[field.fieldId],
            after[field.fieldId],
            [...basePath, fieldSegment(field.fieldId)],
            out
        );
    }
};

const diffField = (
    field: FieldDescriptor,
    beforeValue: unknown,
    afterValue: unknown,
    path: PathSegment[],
    out: ChangesetEntry[]
): void => {
    if (contentHash(beforeValue) === contentHash(afterValue)) {
        return;
    }

    // A scalar is one change, whether it holds one value or a list of them. Reporting
    // `tags[2]` rather than `tags` would be precision no reader asked for.
    if (field.kind === "scalar") {
        out.push({ path: encodePath(path), label: field.label });
        return;
    }

    if (field.list) {
        diffItems(field, asArray(beforeValue), asArray(afterValue), path, out);
        return;
    }

    // A single nested block that appeared or disappeared wholesale.
    if (!isContainer(beforeValue) || !isContainer(afterValue)) {
        out.push({
            path: encodePath(path),
            label: field.label,
            operation: isContainer(afterValue) ? "added" : "removed"
        });
        return;
    }

    diffBlockContents(field, beforeValue, afterValue, path, out);
};

/**
 * Compares one block against its counterpart.
 *
 * A dynamic-zone block whose template changed is a replacement, not an edit: its old and new
 * fields are different fields, so comparing them would produce a list of changes describing a
 * form the reader never filled in.
 */
const diffBlockContents = (
    field: FieldDescriptor,
    beforeItem: Record<string, unknown>,
    afterItem: Record<string, unknown>,
    path: PathSegment[],
    out: ChangesetEntry[]
): void => {
    if (field.kind === "dynamicZone" && templateIdOf(beforeItem) !== templateIdOf(afterItem)) {
        out.push({ path: encodePath(path), label: field.label, operation: "replaced" });
        return;
    }

    const childFields = childFieldsFor(field, afterItem);

    // A template the model no longer defines. Report that the block changed rather than
    // silently dropping it — an unresolvable template is exactly when a reader needs telling.
    if (!childFields) {
        out.push({ path: encodePath(path), label: field.label });
        return;
    }

    diffFields(childFields, beforeItem, afterItem, path, out);
};

const diffItems = (
    field: FieldDescriptor,
    beforeItems: unknown[],
    afterItems: unknown[],
    path: PathSegment[],
    out: ChangesetEntry[]
): void => {
    const matching = matchItems(beforeItems, afterItems);

    for (const beforeIndex of matching.removed) {
        out.push({
            path: encodePath([...path, listItemSegment(beforeItems[beforeIndex], beforeIndex)]),
            label: field.label,
            operation: "removed"
        });
    }

    for (const afterIndex of matching.added) {
        out.push({
            path: encodePath([...path, listItemSegment(afterItems[afterIndex], afterIndex)]),
            label: field.label,
            operation: "added"
        });
    }

    for (const pair of matching.pairs) {
        const beforeItem = beforeItems[pair.beforeIndex];
        const afterItem = afterItems[pair.afterIndex];
        const itemPath = [...path, listItemSegment(afterItem, pair.afterIndex)];

        if (!pair.inOrder) {
            out.push({
                path: encodePath(itemPath),
                label: field.label,
                operation: "moved"
            });
        }

        if (contentHash(beforeItem) === contentHash(afterItem)) {
            continue;
        }

        if (!isContainer(beforeItem) || !isContainer(afterItem)) {
            out.push({ path: encodePath(itemPath), label: field.label });
            continue;
        }

        diffBlockContents(field, beforeItem, afterItem, itemPath, out);
    }
};
