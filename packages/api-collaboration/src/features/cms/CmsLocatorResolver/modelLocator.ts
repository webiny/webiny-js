import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

export interface ModelLocatorResult {
    exists: boolean;
    label?: string;
    /**
     * Ancestor field labels for a breadcrumb display (e.g. ["Address"] for an `address.street`
     * locator). Reflects object / dynamic-zone nesting; excludes the target field itself.
     */
    path?: string[];
}

const isListIndex = (segment: string): boolean => {
    return /^\d+$/.test(segment);
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
 * Walks a `fieldId`-dotted locator (e.g. `author.address.2.street`) against a model definition.
 * Numeric segments are list indices and are skipped for structural matching. Returns whether the
 * field still exists in the model, its label, and the ancestor breadcrumb.
 */
export const walkModelLocator = (model: CmsModel, locator: string): ModelLocatorResult => {
    const segments = locator
        .split(".")
        .filter(segment => segment.length > 0 && !isListIndex(segment));

    if (segments.length === 0) {
        return { exists: false };
    }

    let currentFields: CmsModelField[] = model.fields;
    let field: CmsModelField | undefined;
    const labels: string[] = [];

    for (const segment of segments) {
        field = findByFieldId(currentFields, segment);
        if (!field) {
            return { exists: false };
        }
        labels.push(field.label || field.fieldId);
        currentFields = childFieldsOf(field);
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
