/**
 * The minimal projection of a content model that diffing needs.
 *
 * The differ is parameterised over this rather than over `CmsModel` so that `core/` carries no CMS
 * dependency, and — more usefully — so that every diff behaviour can be tested from hand-written
 * descriptors and hand-written values. That is what makes the algorithm fully testable today
 * despite stable item ids not existing yet on this branch.
 *
 * Only three distinctions matter to diffing: whether a field nests, whether it repeats, and what
 * its children are. Everything else about a field is presentation.
 */

export type FieldKind = "scalar" | "object" | "dynamicZone";

export interface TemplateDescriptor {
    /** Matched against an item's `_templateId`. */
    id: string;
    label: string;
    fields: FieldDescriptor[];
}

export interface FieldDescriptor {
    fieldId: string;
    /**
     * Captured into the changeset at write time, so a timeline stays legible after the field is
     * renamed or removed from the model.
     */
    label: string;
    kind: FieldKind;
    list: boolean;
    /** Children of an `object` field. */
    fields?: FieldDescriptor[];
    /** Templates of a `dynamicZone` field. */
    templates?: TemplateDescriptor[];
}

/** Child fields of one item, resolved for dynamic zones by the item's `_templateId`. */
export const childFieldsFor = (
    descriptor: FieldDescriptor,
    item: unknown
): FieldDescriptor[] | undefined => {
    if (descriptor.kind === "object") {
        return descriptor.fields;
    }

    if (descriptor.kind !== "dynamicZone") {
        return undefined;
    }

    const templateId = templateIdOf(item);
    if (templateId === undefined) {
        return undefined;
    }

    return descriptor.templates?.find(template => template.id === templateId)?.fields;
};

export const templateIdOf = (item: unknown): string | undefined => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return undefined;
    }

    const templateId = (item as { _templateId?: unknown })._templateId;
    return typeof templateId === "string" ? templateId : undefined;
};

/**
 * Label of the deepest field segment in an encoded path.
 *
 * Item and index segments do not advance the descriptor — they select an item *of* the field
 * whose segment precedes them — so the label of `sections#abc.title` is the label of `title`, and
 * the label of `sections#abc` is the label of `sections`. Returns an empty string for the target
 * root, and for any path that no longer resolves against the model.
 */
export const labelForPath = (fields: FieldDescriptor[], segments: string[]): string => {
    let current: FieldDescriptor[] | undefined = fields;
    let label = "";
    let descriptor: FieldDescriptor | undefined;

    for (const segment of segments) {
        if (segment.startsWith("#") || segment.startsWith("[")) {
            // An item of the field we are already standing on.
            continue;
        }

        descriptor = current?.find(field => field.fieldId === segment);
        if (!descriptor) {
            return label;
        }

        label = descriptor.label;

        // Without a value we cannot know which dynamic-zone template applies, so descend only
        // through object fields. A path reaching into a template stops at the zone's own label,
        // which is the honest answer rather than a guess.
        current = descriptor.kind === "object" ? descriptor.fields : undefined;
    }

    return label;
};
