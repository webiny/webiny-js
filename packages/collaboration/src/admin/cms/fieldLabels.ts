/**
 * Client-side mirror of the server CmsLocatorResolver's model walk. Produces the same
 * "Parent › Field" breadcrumb the resolved thread anchor shows, so the composer's location chip
 * matches the created comment's location.
 */
export interface FieldLike {
    fieldId: string;
    label?: string;
    settings?: {
        fields?: FieldLike[];
        templates?: Array<{ fields?: FieldLike[] }>;
    };
}

export interface FieldOption {
    locator: string;
    label: string;
}

const isListIndex = (segment: string): boolean => /^\d+$/.test(segment);

const childrenOf = (field: FieldLike): FieldLike[] => {
    const children: FieldLike[] = [];
    if (field.settings?.fields) {
        children.push(...field.settings.fields);
    }
    if (field.settings?.templates) {
        for (const template of field.settings.templates) {
            if (template.fields) {
                children.push(...template.fields);
            }
        }
    }
    return children;
};

/**
 * Resolves a fieldId-dotted locator (numeric list indices skipped) to a breadcrumb label.
 * Falls back to the raw locator if a segment can't be resolved.
 */
export const buildLocatorLabel = (fields: FieldLike[], locator: string): string => {
    const segments = locator.split(".").filter(part => part.length > 0 && !isListIndex(part));

    let current = fields;
    let field: FieldLike | undefined;
    const labels: string[] = [];

    for (const segment of segments) {
        field = current.find(item => item.fieldId === segment);
        if (!field) {
            return locator;
        }
        labels.push(field.label || field.fieldId);
        current = childrenOf(field);
    }

    return labels.length > 0 ? labels.join(" › ") : locator;
};

/**
 * Flattens all leaf fields (top-level + nested object/dynamic-zone) into selectable options with
 * dotted locators and breadcrumb labels — used to populate the composer's field picker.
 */
export const flattenFields = (
    fields: FieldLike[],
    parentPath = "",
    parentLabels: string[] = []
): FieldOption[] => {
    const options: FieldOption[] = [];

    for (const field of fields) {
        const locator = parentPath ? `${parentPath}.${field.fieldId}` : field.fieldId;
        const labels = [...parentLabels, field.label || field.fieldId];
        const children = childrenOf(field);

        if (children.length === 0) {
            options.push({ locator, label: labels.join(" › ") });
        } else {
            options.push(...flattenFields(children, locator, labels));
        }
    }

    return options;
};
