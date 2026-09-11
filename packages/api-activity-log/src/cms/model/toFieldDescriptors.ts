import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { FieldDescriptor, FieldKind, TemplateDescriptor } from "~/core/diff/descriptors.js";

/**
 * Projects a content model onto the descriptor tree the differ works over.
 *
 * Deliberately reads `model.fields` and the nested `settings.fields` / `settings.templates`
 * directly rather than going through `ModelToAstConverter`. The AST is the richer projection, but
 * it is built from the GraphQL field-type registry, which the CMS only registers during its own
 * GraphQL build — and capture runs inside an entry write, which can happen without any GraphQL
 * schema having been built. Diffing needs only three facts per field (does it nest, does it
 * repeat, what are its children), and all three are on the field itself.
 *
 * Values are keyed by `fieldId`, matching `ContentEntryTraverser`. `storageId` keys exist only
 * below the storage transforms, which capture never sees.
 */

const UI_ONLY_TYPES = new Set(["uiSeparator", "uiAlert", "uiTabs"]);

const kindOf = (field: CmsModelField): FieldKind => {
    if (field.type === "object") {
        return "object";
    }

    if (field.type === "dynamicZone") {
        return "dynamicZone";
    }

    return "scalar";
};

const toTemplateDescriptors = (field: CmsModelField): TemplateDescriptor[] | undefined => {
    const templates = field.settings?.templates;

    if (!Array.isArray(templates)) {
        return undefined;
    }

    return templates.map(template => ({
        id: template.id,
        label: template.name ?? template.id,
        fields: toFieldDescriptors(template.fields ?? [])
    }));
};

export const toFieldDescriptors = (fields: CmsModelField[]): FieldDescriptor[] => {
    const descriptors: FieldDescriptor[] = [];

    for (const field of fields) {
        // Layout-only fields hold no value, so they can never differ. Excluding them keeps the
        // descriptor tree the shape of the data rather than the shape of the form.
        if (UI_ONLY_TYPES.has(field.type)) {
            continue;
        }

        const kind = kindOf(field);

        descriptors.push({
            fieldId: field.fieldId,
            // A label captured now is what keeps an old record legible after the field is
            // renamed. Falling back to the id is better than an empty timeline row.
            label: field.label || field.fieldId,
            kind,
            list: field.list === true,
            ...(kind === "object"
                ? { fields: toFieldDescriptors(field.settings?.fields ?? []) }
                : {}),
            ...(kind === "dynamicZone" ? { templates: toTemplateDescriptors(field) } : {})
        });
    }

    return descriptors;
};

export const modelToFieldDescriptors = (model: Pick<CmsModel, "fields">): FieldDescriptor[] => {
    return toFieldDescriptors(model.fields ?? []);
};
