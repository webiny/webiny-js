import zod from "zod";
import camelCase from "lodash/camelCase.js";
import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";
import { READ_ONLY_RULE, isReadOnlyRule } from "~/utils/readOnlyFieldRule.js";

const fieldIdSchema = zod
    .string()
    .max(100)
    .regex(/^!?[a-zA-Z]/, { message: "Must not start with a number." })
    .regex(/^(^[a-zA-Z0-9]+)$/, { message: "Must be alphanumeric string." });

export class GeneralGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "general";
    label = "General";

    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext) {
        const { fieldType, field } = context;
        const isNewField = !field.id;

        form.fields(fields => {
            const fieldIdBuilder = fields
                .text()
                .label("Field ID")
                .required()
                .schema(fieldIdSchema)
                .beforeChange(value => String(value).trim());

            if (isNewField) {
                fieldIdBuilder.computedUntilDirty(({ form }) => {
                    return camelCase(String(form.field("general.label").getValue() || ""));
                });
            }

            return {
                label: fields.text().label("Label").required().autoFocus(),
                fieldId: fieldIdBuilder,
                list: fields
                    .boolean()
                    .label(fieldType.listLabel || "Use as a list")
                    .disabled(!fieldType.allowList),
                predefinedValuesEnabled: fields
                    .boolean()
                    .label("Use predefined values")
                    .disabled(!fieldType.allowPredefinedValues),
                readOnly: fields
                    .boolean()
                    .label("Read-only")
                    .description(
                        "Editors can see this field but can't change its value. Useful for values set by code, for example an external ID or a generated slug."
                    ),
                description: fields
                    .text()
                    .label("Description")
                    .description("This text will be shown below the label (optional)"),
                note: fields
                    .text()
                    .label("Note")
                    .description("This text will be shown below the input (optional)"),
                help: fields
                    .text()
                    .label("Help")
                    .renderer("textarea")
                    .description("This text will be shown in a tooltip (optional)"),
                tags: fields
                    .text()
                    .label("Tags")
                    .renderer("tags")
                    .list()
                    .description(
                        "Field tags are useful for developers and are not visible in the UI (optional)"
                    )
            };
        });

        form.layout(layout => [
            layout.row("label", "fieldId"),
            layout.row("list", "predefinedValuesEnabled"),
            layout.row("readOnly"),
            layout.row("description"),
            layout.row("note"),
            layout.row("help"),
            layout.row("tags")
        ]);
    }

    mapToForm(field: CmsModelField) {
        return {
            label: field.label ?? "",
            fieldId: field.fieldId ?? "",
            list: field.list ?? false,
            predefinedValuesEnabled: field.predefinedValues?.enabled ?? false,
            readOnly: (field.rules ?? []).some(isReadOnlyRule),
            description: field.description ?? "",
            note: field.note ?? "",
            help: field.help ?? "",
            tags: field.tags ?? []
        };
    }

    mapFromForm(formData: Record<string, any>, field: CmsModelField) {
        field.label = formData.label;
        field.fieldId = formData.fieldId;
        field.list = formData.list;
        if (!field.predefinedValues) {
            field.predefinedValues = { enabled: false, values: [] };
        }
        field.predefinedValues.enabled = formData.predefinedValuesEnabled;
        /**
         * Read-only is stored as a field rule, so we rewrite only our own rule and leave
         * the condition and permission rules owned by the other groups untouched.
         */
        field.rules = [
            ...(field.rules ?? []).filter(rule => !isReadOnlyRule(rule)),
            ...(formData.readOnly ? [{ ...READ_ONLY_RULE }] : [])
        ];
        field.description = formData.description;
        field.note = formData.note;
        field.help = formData.help;
        field.tags = formData.tags;
    }
}

export const GeneralGroup = CmsFieldEditorGroup.createImplementation({
    implementation: GeneralGroupImpl,
    dependencies: []
});
