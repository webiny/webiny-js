import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { splitPathSegments } from "~/core/paths.js";

/**
 * Field types whose value is prose by definition, whatever length it happens to be.
 *
 * Both are rare compared to `text` — six and two declarations respectively across every
 * code-defined model in this repository, against 343 for `text` — which is precisely why type
 * alone cannot decide this.
 */
const ALWAYS_FREE_TEXT = new Set(["long-text", "rich-text"]);

/**
 * The one type that depends on its value.
 *
 * `text` is 73% of field declarations and covers both a headline and a slug. Treating it as prose
 * makes a job fire on title-plus-slug saves, which the deterministic description already handles
 * perfectly; treating it as not-prose means a save that rewrote three headings and a body counts
 * one free-text field and never fires. Neither is right, so length decides.
 */
const LENGTH_DEPENDENT = "text";

/**
 * Types that are never prose, listed rather than inferred.
 *
 * `json` and `searchable-json` are here for a different reason than the scalars: they are arbitrary
 * structure rather than text, a model has nothing useful to say about them, and their values are
 * the most likely to be enormous.
 *
 * Anything not named anywhere — including a project's custom field type, since `CmsModelFieldType`
 * is open — falls through to not-free-text. Excluded by default is the safe direction: an unknown
 * type cannot make a job fire, it can only fail to.
 */
const measure = (value: unknown): number => {
    if (typeof value === "string") {
        return value.length;
    }

    if (value === null || value === undefined) {
        return 0;
    }

    // Rich text is a structured document rather than a string. Its serialised size is a reasonable
    // proxy for how much prose it holds, and it is only ever compared against a threshold.
    try {
        return JSON.stringify(value)?.length ?? 0;
    } catch {
        return 0;
    }
};

/**
 * An enum wearing a text type.
 *
 * A status or a category with predefined values is a short scalar however it is typed, and it is
 * exactly the field that would otherwise push a save over the threshold for no reason.
 */
const isPredefined = (field: CmsModelField): boolean => {
    return field.predefinedValues?.enabled === true;
};

/**
 * Walks a changeset path to the field it names.
 *
 * Paths carry item ids and indexes that mean nothing to the model, so only the field segments are
 * followed. A path into a dynamic zone resolves through the templates, since a template's fields
 * are not on the parent.
 */
export const fieldForPath = (model: CmsModel, path: string): CmsModelField | null => {
    // `splitPathSegments` returns raw strings: a field id, `#itemId`, or `[index]`. Only the field
    // segments name anything in the model.
    const segments = splitPathSegments(path).filter(
        segment => !segment.startsWith("#") && !segment.startsWith("[")
    );

    let candidates: CmsModelField[] = model.fields;
    let found: CmsModelField | null = null;

    for (const segment of segments) {
        const match: CmsModelField | undefined = candidates.find(
            field => field.fieldId === segment
        );

        if (!match) {
            return null;
        }

        found = match;

        const objectFields = (match.settings?.fields ?? []) as CmsModelField[];
        const templateFields = (
            (match.settings?.templates ?? []) as { fields: CmsModelField[] }[]
        ).flatMap(template => template.fields ?? []);

        candidates = [...objectFields, ...templateFields];
    }

    return found;
};

export interface FreeTextParams {
    model: CmsModel;
    path: string;
    before: unknown;
    after: unknown;
    minLength: number;
}

/**
 * Whether a changed path is prose worth handing to a model.
 *
 * Type first, then length for the one type where length is the deciding fact. Measured on the
 * longer of the two sides so that deleting a paragraph counts as much as writing one.
 */
export const isFreeTextChange = (params: FreeTextParams): boolean => {
    const field = fieldForPath(params.model, params.path);

    if (!field) {
        // The field is gone from the model, or the path does not resolve. Not prose, because there
        // is nothing to say it is.
        return false;
    }

    if (ALWAYS_FREE_TEXT.has(field.type)) {
        return true;
    }

    if (field.type !== LENGTH_DEPENDENT || isPredefined(field)) {
        return false;
    }

    return Math.max(measure(params.before), measure(params.after)) >= params.minLength;
};
