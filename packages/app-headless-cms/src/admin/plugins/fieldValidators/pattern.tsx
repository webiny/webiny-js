import React from "react";
import { Grid, Input, Select } from "@webiny/admin-ui";
import { plugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { CmsModelFieldValidatorPlugin, CmsModelFieldRegexValidatorExpressionPlugin } from "~/types";
import { useForm, Bind } from "@webiny/form";

const PatternSettings = () => {
    const { data: validator, setValue } = useForm();
    const inputsDisabled = validator.settings.preset !== "custom";
    const presetPlugins = plugins.byType<CmsModelFieldRegexValidatorExpressionPlugin>(
        "cms-model-field-regex-validator-expression"
    );

    const setMessage = (message: string) => {
        setValue("message", message);
    };

    const selectOptions: any = presetPlugins.map(item => ({
        label: item.pattern.label,
        value: item.pattern.name
    }));

    return (
        <>
            <Grid.Column span={3}>
                <Bind
                    name={"settings.preset"}
                    validators={validation.create("required")}
                    afterChange={value => {
                        if (value === "custom") {
                            setMessage("Invalid value.");
                            return;
                        }

                        setValue("settings.regex", null);
                        setValue("settings.flags", null);

                        const selectedPatternPlugin = presetPlugins.find(
                            item => item.pattern.name === value
                        );
                        if (!selectedPatternPlugin) {
                            setMessage(`Missing pattern plugin "${value}".`);
                            return;
                        }

                        setMessage(selectedPatternPlugin.pattern.message);
                    }}
                >
                    <Select
                        label={"Preset"}
                        description={"Choose a regex pattern."}
                        options={[{ value: "custom", label: "Custom" }, ...selectOptions]}
                        displayResetAction={false}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={7}>
                <Bind name={"settings.regex"} validators={validation.create("required")}>
                    <Input
                        disabled={inputsDisabled}
                        label={"Regex"}
                        description={"Enter the regex pattern to test."}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={2}>
                <Bind name={"settings.flags"} validators={validation.create("required")}>
                    <Input
                        disabled={inputsDisabled}
                        label={"Flags"}
                        description={"Add regex flags."}
                    />
                </Bind>
            </Grid.Column>
        </>
    );
};

const plugin: CmsModelFieldValidatorPlugin = {
    type: "cms-model-field-validator",
    name: "cms-editor-field-validator-pattern",
    validator: {
        name: "pattern",
        label: "Pattern",
        description: "Entered value must match a specific pattern.",
        defaultMessage: "Invalid value.",
        defaultSettings: {
            preset: "custom"
        },
        renderSettings() {
            return <PatternSettings />;
        },
        validate: async (value, { validator }) => {
            if (!value) {
                return true;
            }

            const { settings } = validator;

            let pattern;
            if (settings.preset === "custom") {
                pattern = settings;
            } else {
                const patternPlugin = plugins
                    .byType<CmsModelFieldRegexValidatorExpressionPlugin>(
                        "cms-model-field-regex-validator-expression"
                    )
                    .find(item => item.pattern.name === settings.preset);

                if (patternPlugin) {
                    pattern = patternPlugin.pattern;
                }
            }

            if (!pattern) {
                return true;
            }

            return new RegExp(pattern.regex, pattern.flags).test(value);
        }
    }
};
export default plugin;
