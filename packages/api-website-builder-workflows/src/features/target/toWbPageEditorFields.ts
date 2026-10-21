import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import type { ReviewTargetEditorField } from "@webiny/api-workflows/features/review/ReviewTargetEditor/abstractions.js";

/** The parts of a page the editor reads. */
export type WbPageEditorSource = Pick<
    WbPage,
    "properties" | "location" | "status" | "metadata" | "bindings" | "elements" | "extensions"
>;

/** A field the AI may write (R172). */
export interface WbPageWritableField {
    /** The key `update` takes. */
    path: string;
    /** The key inside `properties.seo`; empty for the page title. */
    key: string;
    label: string;
    type: string;
}

/** What the model reads for the element tree instead of the tree itself. */
export interface WbElementsSummary {
    count: number;
    /** Component name to the number of elements that use it. */
    components: Record<string, number>;
}

export const WB_PAGE_TITLE_FIELD: WbPageWritableField = {
    path: "properties.title",
    key: "",
    label: "Page title",
    type: "text"
};

/** The SEO scalars of the page editor's SEO group (R172). `metaTags` and the rest are read-only. */
export const WB_PAGE_SEO_FIELDS: WbPageWritableField[] = [
    { path: "properties.seo.title", key: "title", label: "SEO title", type: "text" },
    {
        path: "properties.seo.description",
        key: "description",
        label: "SEO description",
        type: "long-text"
    },
    {
        path: "properties.seo.canonicalUrl",
        key: "canonicalUrl",
        label: "SEO canonical URL",
        type: "text"
    },
    { path: "properties.seo.noIndex", key: "noIndex", label: "SEO no index", type: "boolean" },
    { path: "properties.seo.noFollow", key: "noFollow", label: "SEO no follow", type: "boolean" }
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const typeOfValue = (value: unknown): string => {
    if (value === null || value === undefined) {
        return "null";
    }
    if (Array.isArray(value)) {
        return "list";
    }
    switch (typeof value) {
        case "string":
            return "text";
        case "number":
            return "number";
        case "boolean":
            return "boolean";
        default:
            return "object";
    }
};

const toWritableRow = (field: WbPageWritableField, value: unknown): ReviewTargetEditorField => {
    return {
        path: field.path,
        label: field.label,
        type: field.type,
        value: value === undefined ? null : value,
        writable: true
    };
};

const toReadOnlyRow = (path: string, value: unknown): ReviewTargetEditorField => {
    return {
        path,
        label: path,
        type: typeOfValue(value),
        value: value === undefined ? null : value,
        writable: false
    };
};

const summarizeElements = (elements: unknown): WbElementsSummary => {
    const components = new Map<string, number>();
    let count = 0;
    if (isRecord(elements)) {
        for (const element of Object.values(elements)) {
            count++;
            const component = isRecord(element) ? element.component : undefined;
            const name =
                isRecord(component) && typeof component.name === "string"
                    ? component.name
                    : "(none)";
            components.set(name, (components.get(name) ?? 0) + 1);
        }
    }
    return { count, components: Object.fromEntries(components) };
};

/**
 * The page as the target editor shows it (R172): the title, every other `properties` key as one
 * read-only row with its whole value, the five writable SEO scalars, the rest of the SEO group as
 * read-only rows, the read-only page parts (`location`, `status`, `metadata`, `bindings`,
 * `extensions`) and a read-only summary of the element tree. `properties.path` and
 * `properties.language` are never writable. A `properties` key that contains a dot is skipped: its
 * row path could shadow an allowlisted path. Throws when `properties` is missing (the editor turns
 * that into a failed Result). Pure.
 */
export const toWbPageEditorFields = (page: WbPageEditorSource): ReviewTargetEditorField[] => {
    const properties: Record<string, unknown> = page.properties;
    const seo = isRecord(properties.seo) ? properties.seo : {};
    const rows: ReviewTargetEditorField[] = [toWritableRow(WB_PAGE_TITLE_FIELD, properties.title)];

    for (const [key, value] of Object.entries(properties)) {
        if (key === "title" || key === "seo" || key.includes(".")) {
            continue;
        }
        rows.push(toReadOnlyRow(`properties.${key}`, value));
    }
    for (const field of WB_PAGE_SEO_FIELDS) {
        rows.push(toWritableRow(field, seo[field.key]));
    }
    for (const [key, value] of Object.entries(seo)) {
        if (key.includes(".") || WB_PAGE_SEO_FIELDS.some(field => field.key === key)) {
            continue;
        }
        rows.push(toReadOnlyRow(`properties.seo.${key}`, value));
    }

    rows.push(
        toReadOnlyRow("location", page.location),
        toReadOnlyRow("status", page.status),
        toReadOnlyRow("metadata", page.metadata),
        toReadOnlyRow("bindings", page.bindings),
        toReadOnlyRow("extensions", page.extensions),
        {
            path: "elements",
            label: "elements",
            type: "object",
            value: summarizeElements(page.elements),
            writable: false
        }
    );
    return rows;
};
