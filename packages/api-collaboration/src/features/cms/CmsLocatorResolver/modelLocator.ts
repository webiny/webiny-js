import type { CmsModel, CmsModelField, CmsEntryValues } from "@webiny/api-headless-cms/types";

export interface ModelLocatorResult {
    exists: boolean;
    label?: string;
    /**
     * Ancestor field labels for a breadcrumb display (e.g. ["Address"] for an `address.street`
     * locator). Reflects object / dynamic-zone nesting; excludes the target field itself and any
     * list item id / index segments.
     */
    path?: string[];
}

const isListIndex = (segment: string): boolean => {
    return /^\d+$/.test(segment);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * Object fields expose children via `settings.fields`; dynamic-zone fields via
 * `settings.templates[].fields`. We flatten both so a `fieldId` segment can be matched
 * regardless of which template it belongs to.
 */
const childFieldsOf = (field: CmsModelField): CmsModelField[] => {
    const children: CmsModelField[] = [];
    const settings = field.settings;
    if (settings?.fields) {
        children.push(...settings.fields);
    }
    if (settings?.templates) {
        for (const template of settings.templates) {
            if (template.fields) {
                children.push(...template.fields);
            }
        }
    }
    return children;
};

const findByFieldId = (fields: CmsModelField[], fieldId: string): CmsModelField | undefined => {
    return fields.find(field => field.fieldId === fieldId);
};

/**
 * Walks a `fieldId`-dotted locator against a model definition. List/dynamic-zone fields are
 * followed by an item identifier segment — either a legacy numeric index (`author.phone.2.type`)
 * or a stable alphanumeric `_id` (`author.phone.abc123.type`) — which selects a single array
 * element. Those selector segments are consumed and excluded from the breadcrumb; only field
 * labels remain. A stray numeric segment with no matching field is tolerated (legacy locators).
 *
 * Returns whether the field still exists in the model, its label, and the ancestor breadcrumb.
 */
export const walkModelLocator = (model: CmsModel, locator: string): ModelLocatorResult => {
    const segments = locator.split(".").filter(segment => segment.length > 0);

    if (segments.length === 0) {
        return { exists: false };
    }

    let currentFields: CmsModelField[] = model.fields;
    let field: CmsModelField | undefined;
    const labels: string[] = [];

    let i = 0;
    while (i < segments.length) {
        const segment = segments[i];

        const matched = findByFieldId(currentFields, segment);
        if (!matched) {
            // Tolerate a stray numeric index that isn't tied to a matched list field (legacy
            // locators stripped all numeric segments up front).
            if (isListIndex(segment)) {
                i++;
                continue;
            }
            return { exists: false };
        }

        field = matched;
        labels.push(field.label || field.fieldId);
        currentFields = childFieldsOf(field);
        i++;

        // A list field is followed by an item selector: numeric index (handled by the stray-index
        // branch on the next turn) or an alphanumeric `_id` (skipped here). Excluded from labels.
        if (field.list && i < segments.length && !isListIndex(segments[i])) {
            i++;
        }
    }

    if (!field) {
        return { exists: false };
    }

    const label = field.label || field.fieldId;
    const ancestors = labels.slice(0, -1);

    return {
        exists: true,
        label,
        path: ancestors.length > 0 ? ancestors : undefined
    };
};

/**
 * Best-effort check that an id-anchored locator still points at a live array element. Navigates the
 * loaded entry values in parallel with the model: at each list field the following segment selects
 * an item (by `_id` for stable ids, or by index for legacy numeric selectors).
 *
 * Deliberately conservative — it only returns `false` when it positively confirms a present array
 * lacks the referenced item (a deleted list element -> a gracefully "outdated" thread). Whenever
 * the values are missing or not the expected shape (nothing to verify against), it returns `true`
 * so a valid thread is never hidden by a false negative.
 */
export const itemStillExists = (
    model: CmsModel,
    values: CmsEntryValues | undefined,
    locator: string
): boolean => {
    if (!values) {
        return true;
    }

    const segments = locator.split(".").filter(segment => segment.length > 0);

    let currentFields: CmsModelField[] = model.fields;
    let node: unknown = values;
    let i = 0;

    while (i < segments.length) {
        const segment = segments[i];
        const field = findByFieldId(currentFields, segment);
        if (!field) {
            // Stray numeric or unknown segment — can't verify structurally, assume it exists.
            return true;
        }

        const fieldValue = isRecord(node) ? node[field.fieldId] : undefined;
        currentFields = childFieldsOf(field);
        i++;

        if (field.list && i < segments.length) {
            const selector = segments[i];
            i++;

            if (!Array.isArray(fieldValue)) {
                // Values not loaded / not an array — nothing reliable to check against.
                return true;
            }

            let next: unknown;
            if (isListIndex(selector)) {
                next = fieldValue[Number(selector)];
            } else {
                next = fieldValue.find(item => isRecord(item) && item._id === selector);
            }

            if (next === undefined) {
                // Confirmed: the referenced list item was removed.
                return false;
            }
            node = next;
        } else {
            node = fieldValue;
        }
    }

    return true;
};
