import { CmsFieldEditorGroup } from "../abstractions.js";
import type { ICmsFieldEditorFormBuilder, ICmsFieldEditorContext } from "../abstractions.js";
import type { CmsModelField } from "~/types.js";
import type { CmsModelFieldValidatorsGroup } from "@webiny/app-headless-cms-common/types/validation.js";
import { CmsFieldValidator } from "~/presentation/fieldValidators/abstractions.js";
import type {
    ICmsFieldValidator,
    ICmsFieldValidatorFormBuilder
} from "~/presentation/fieldValidators/abstractions.js";
import type { FormModelFactory, FormModel } from "@webiny/app-admin";

function resolveValidatorNames(
    config:
        | string[]
        | CmsModelFieldValidatorsGroup
        | ((field: CmsModelField) => string[] | CmsModelFieldValidatorsGroup)
        | undefined,
    field: CmsModelField
): string[] {
    if (!config) {
        return [];
    }
    if (typeof config === "function") {
        return resolveValidatorNames(config(field), field);
    }
    if (Array.isArray(config)) {
        return config;
    }
    return config.validators.map(v => (typeof v === "string" ? v : v.name));
}

interface ValidatorBuildResult {
    fields: Record<string, FormModelFactory.FieldBuilder>;
    layouts: Map<
        string,
        {
            settingsLayoutFns: Array<
                (l: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]
            >;
            hasSettings: boolean;
        }
    >;
}

class ValidationsGroupImpl implements CmsFieldEditorGroup.Interface {
    name = "validations";
    label = "Validations";

    constructor(private allValidators: ICmsFieldValidator[]) {}

    buildForm(form: ICmsFieldEditorFormBuilder, context: ICmsFieldEditorContext) {
        const fieldValidatorNames = resolveValidatorNames(
            context.fieldType.validators,
            context.field
        );
        const listValidatorNames = resolveValidatorNames(
            context.fieldType.listValidators,
            context.field
        );

        const fieldValidators = this.allValidators.filter(v =>
            fieldValidatorNames.includes(v.name)
        );
        const listValidators = this.allValidators.filter(v => listValidatorNames.includes(v.name));

        let fieldResult: ValidatorBuildResult | null = null;
        let listResult: ValidatorBuildResult | null = null;

        form.fields(fields => {
            const result: Record<string, FormModelFactory.FieldBuilder> = {};

            if (fieldValidators.length > 0) {
                fieldResult = this.buildValidatorFields(
                    fields as FormModelFactory.FieldBuilderRegistry,
                    fieldValidators,
                    context
                );
                result.validation = fields
                    .object()
                    .renderer("passthrough")
                    .fields(() => fieldResult!.fields);
            }

            if (listValidators.length > 0) {
                listResult = this.buildValidatorFields(
                    fields as FormModelFactory.FieldBuilderRegistry,
                    listValidators,
                    context
                );
                result.listValidation = fields
                    .object()
                    .renderer("passthrough")
                    .hiddenWhen((f: FormModel.Interface) => !f.field("general.list").getValue())
                    .fields(() => listResult!.fields);
            }

            return result;
        });

        form.layout(layout => {
            const rows: FormModel.LayoutNodeBuilder[] = [];

            if (fieldValidators.length > 0 && fieldResult) {
                rows.push(
                    layout.object("validation", inner =>
                        this.buildValidatorLayouts(inner, fieldValidators, fieldResult!)
                    )
                );
            }

            if (listValidators.length > 0 && listResult) {
                rows.push(
                    layout.object("listValidation", inner =>
                        this.buildValidatorLayouts(inner, listValidators, listResult!)
                    )
                );
            }

            return rows;
        });
    }

    private buildValidatorLayouts(
        layout: FormModelFactory.LayoutBuilder,
        validators: ICmsFieldValidator[],
        result: ValidatorBuildResult
    ): FormModel.LayoutNodeBuilder[] {
        return validators.map(validator => {
            const meta = result.layouts.get(validator.name);
            return layout.object(validator.name, inner => {
                const rows: FormModel.LayoutNodeBuilder[] = [inner.row("message")];
                if (meta && meta.hasSettings) {
                    rows.push(
                        inner.object("settings", settingsLayout =>
                            meta.settingsLayoutFns.flatMap(fn => fn(settingsLayout))
                        )
                    );
                }
                return rows;
            });
        });
    }

    private buildValidatorFields(
        fields: FormModelFactory.FieldBuilderRegistry,
        validators: ICmsFieldValidator[],
        context: ICmsFieldEditorContext
    ): ValidatorBuildResult {
        const resultFields: Record<string, FormModelFactory.FieldBuilder> = {};
        const layouts = new Map<
            string,
            {
                settingsLayoutFns: Array<
                    (l: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]
                >;
                hasSettings: boolean;
            }
        >();

        for (const validator of validators) {
            let messageDescription = "This message will be displayed to the user.";
            if (validator.variables && validator.variables.length > 0) {
                const vars = validator.variables.map(v => `{${v.name}}`).join(", ");
                messageDescription += ` Available variables: ${vars}.`;
            }

            const childFields: Record<string, FormModelFactory.FieldBuilder> = {
                enabled: fields.boolean().label("Enabled").defaultValue(false).hidden(),
                message: fields
                    .text()
                    .label("Message")
                    .description(messageDescription)
                    .defaultValue(validator.defaultMessage)
            };

            const settingsLayoutFns: Array<
                (l: FormModelFactory.LayoutBuilder) => FormModel.LayoutNodeBuilder[]
            > = [];
            let hasSettings = false;

            if (validator.buildSettingsForm) {
                const settingsFieldsFns: Array<
                    (
                        f: FormModelFactory.FieldBuilderRegistry
                    ) => Record<string, FormModelFactory.FieldBuilder>
                > = [];

                const builder: ICmsFieldValidatorFormBuilder = {
                    message: childFields.message,
                    fields: fn => {
                        settingsFieldsFns.push(fn);
                    },
                    layout: fn => {
                        settingsLayoutFns.push(fn);
                    }
                };
                validator.buildSettingsForm(builder, { field: context.field });

                if (settingsFieldsFns.length > 0) {
                    hasSettings = true;
                    childFields.settings = fields
                        .object()
                        .renderer("passthrough")
                        .fields((f: FormModelFactory.FieldBuilderRegistry) => {
                            const merged: Record<string, FormModelFactory.FieldBuilder> = {};
                            for (const fn of settingsFieldsFns) {
                                Object.assign(merged, fn(f));
                            }
                            return merged;
                        });
                }
            }

            layouts.set(validator.name, { settingsLayoutFns, hasSettings });

            resultFields[validator.name] = fields
                .object()
                .label(validator.label)
                .description(validator.description)
                .renderer("cmsValidatorItem")
                .fields(() => childFields);
        }

        return { fields: resultFields, layouts };
    }

    mapToForm(field: CmsModelField) {
        const validationMap: Record<string, Record<string, unknown>> = {};
        for (const v of field.validation || []) {
            const validator = v as {
                name: string;
                message?: string;
                settings?: Record<string, unknown>;
            };
            validationMap[validator.name] = {
                enabled: true,
                message: validator.message,
                settings: validator.settings || {}
            };
        }

        const listValidationMap: Record<string, Record<string, unknown>> = {};
        for (const v of field.listValidation || []) {
            listValidationMap[v.name] = {
                enabled: true,
                message: v.message,
                settings: v.settings || {}
            };
        }

        return {
            validation: validationMap,
            listValidation: listValidationMap
        };
    }

    mapFromForm(formData: Record<string, unknown>, field: CmsModelField) {
        field.validation = this.flattenValidators(
            (formData.validation || {}) as Record<string, any>
        );
        field.listValidation = this.flattenValidators(
            (formData.listValidation || {}) as Record<string, any>
        );
    }

    private flattenValidators(
        data: Record<
            string,
            {
                enabled?: boolean;
                message?: string;
                settings?: Record<string, unknown>;
            }
        >
    ) {
        return Object.entries(data)
            .filter(([_, v]) => v && v.enabled)
            .map(([name, v]) => ({
                name,
                message: v.message,
                settings: v.settings
            }));
    }
}

export const ValidationsGroup = CmsFieldEditorGroup.createImplementation({
    implementation: ValidationsGroupImpl,
    dependencies: [[CmsFieldValidator, { multiple: true }]]
});
