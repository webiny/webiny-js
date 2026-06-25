import { z } from "zod";
import type { IFieldBuilder } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsModelFieldValidator } from "~/types.js";
import type { CmsModelField } from "~/types.js";
import { CmsFieldValidator } from "../abstractions.js";
import type { ICmsFieldValidatorFormBuilder, ICmsFieldValidatorContext } from "../abstractions.js";
import { CmsValidatorPatternFactory } from "../patternAbstractions.js";
import type { ICmsValidatorPatternFactory, ICmsValidatorPattern } from "../patternAbstractions.js";

class PatternValidatorImpl implements CmsFieldValidator.Interface {
    name = "pattern";
    label = "Pattern";
    description = "Entered value must match a specific pattern.";
    defaultMessage = "Invalid value.";
    defaultSettings = { preset: "custom" };

    constructor(private patternFactories: ICmsValidatorPatternFactory[]) {}

    buildSettingsForm(form: ICmsFieldValidatorFormBuilder, context: ICmsFieldValidatorContext) {
        const patterns = this.resolvePatterns(context);

        const presetOptions = [
            { value: "custom", label: "Custom" },
            ...patterns.map(p => ({ value: p.name, label: p.label }))
        ];

        form.message.computedUntilDirty(f => {
            const preset = f.field("$.settings.preset").getValue() as string;
            if (preset === "custom") {
                return "Invalid value.";
            }
            const pattern = patterns.find(p => p.name === preset);
            return pattern ? pattern.message : "Invalid value.";
        });

        form.fields(fields => ({
            preset: fields
                .text()
                .label("Preset")
                .description("Select a preset.")
                .options(presetOptions)
                .required()
                .defaultValue("custom")
                .afterChange((value, f) => {
                    if (value !== "custom") {
                        f.field("$.regex").setValue(null);
                        f.field("$.flags").setValue(null);
                    }
                }),
            regex: fields
                .text()
                .label("Regex")
                .description("Regex pattern to test.")
                .required()
                .disabledWhen(f => f.field("$.preset").getValue() !== "custom"),
            flags: fields
                .text()
                .label("Flags")
                .description("Add regex flags.")
                .required()
                .disabledWhen(f => f.field("$.preset").getValue() !== "custom")
        }));
        form.layout(layout => [layout.row("preset", "regex", "flags")]);
    }

    mapToFieldBuilder(
        builder: IFieldBuilder,
        validator: CmsModelFieldValidator,
        field: CmsModelField
    ) {
        const settings = validator.settings || {};
        let regex: string | undefined;
        let flags: string | undefined;

        if (settings.preset === "custom") {
            regex = settings.regex;
            flags = settings.flags;
        } else {
            const patterns = this.resolvePatterns({ field });
            const pattern = patterns.find(p => p.name === settings.preset);
            if (pattern) {
                regex = pattern.regex;
                flags = pattern.flags;
            }
        }

        if (regex) {
            builder.schema(
                z.string().regex(new RegExp(regex, flags || ""), validator.message || undefined)
            );
        }
    }

    private resolvePatterns(context: ICmsFieldValidatorContext): ICmsValidatorPattern[] {
        return this.patternFactories.flatMap(f => f.getPatterns({ field: context.field }));
    }
}

export const PatternValidator = CmsFieldValidator.createImplementation({
    implementation: PatternValidatorImpl,
    dependencies: [[CmsValidatorPatternFactory, { multiple: true }]]
});
