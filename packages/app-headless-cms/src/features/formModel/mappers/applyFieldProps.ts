import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelField } from "~/types.js";
import { mapCmsRendererName } from "../CmsRendererMap.js";
import { mapCmsValidators } from "../CmsValidationMapper.js";

export function applyFieldProps(builder: IFieldBuilder, field: CmsModelField): IFieldBuilder {
    if (field.label) {
        builder.label(field.label);
    }
    if (field.help) {
        builder.help(String(field.help));
    }
    if (field.description) {
        builder.description(String(field.description));
    }
    if (field.note) {
        builder.note(String(field.note));
    }
    if (field.placeholder) {
        builder.placeholder(field.placeholder);
    }

    if (field.settings?.defaultValue != null) {
        builder.defaultValue(field.settings.defaultValue);
    }

    if (field.list) {
        builder.list();
    }

    if (field.predefinedValues?.enabled && field.predefinedValues.values) {
        const optionsBuilder = builder as any;
        if (typeof optionsBuilder.options === "function") {
            optionsBuilder.options(
                field.predefinedValues.values.map(
                    (v: { label: string; value: string; selected?: boolean }) => ({
                        label: v.label,
                        value: v.value
                    })
                )
            );
        }
    }

    const { required, requiredMessage, schema } = mapCmsValidators(field.validation);
    if (required) {
        builder.required(requiredMessage);
    }
    if (schema) {
        builder.schema(schema);
    }

    if (field.renderer && typeof field.renderer === "object") {
        const mappedRenderer = mapCmsRendererName(field.renderer.name);
        if (mappedRenderer) {
            builder.renderer(mappedRenderer as any, field.renderer.settings);
        }
    }

    if (field.rules && field.rules.length > 0) {
        builder.rules(
            field.rules.map(r => ({
                type: r.type,
                target: r.target,
                operator: r.operator,
                value: r.value != null ? String(r.value) : null,
                action: r.action as "hide" | "disable"
            }))
        );
    }

    if (field.tags && field.tags.length > 0) {
        builder.tags(field.tags);
    }

    return builder;
}
