import type { FieldDescriptor, TemplateDescriptor } from "~/core/diff/descriptors.js";

export const scalar = (fieldId: string, list = false): FieldDescriptor => ({
    fieldId,
    label: fieldId,
    kind: "scalar",
    list
});

export const object = (
    fieldId: string,
    fields: FieldDescriptor[],
    list = false
): FieldDescriptor => ({
    fieldId,
    label: fieldId,
    kind: "object",
    list,
    fields
});

export const template = (id: string, fields: FieldDescriptor[]): TemplateDescriptor => ({
    id,
    label: id,
    fields
});

export const zone = (
    fieldId: string,
    templates: TemplateDescriptor[],
    list = true
): FieldDescriptor => ({
    fieldId,
    label: fieldId,
    kind: "dynamicZone",
    list,
    templates
});

/** Compact rendering of a changeset, so expectations read as the timeline would. */
export const summarise = (changeset: { path: string; operation?: string }[]): string[] => {
    return changeset.map(entry =>
        entry.operation ? `${entry.operation} ${entry.path}` : entry.path
    );
};
