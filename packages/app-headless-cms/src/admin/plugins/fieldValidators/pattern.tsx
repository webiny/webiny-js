import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { Select } from "@webiny/ui/Select";
import { plugins } from "@webiny/plugins";
import { validation } from "@webiny/validation";
import { CmsEditorFieldValidatorPlugin, CmsEditorFieldValidatorPatternPlugin } from "~/types";
import { useForm, Bind } from "@webiny/form";

const PatternSettings = () => {
    const { data: validator, setValue } = useForm();
    const inputsDisabled = validator.settings.preset !== "custom";
    const presetPlugins = plugins.byType<CmsEditorFieldValidatorPatternPlugin>(
        "cms-editor-field-validator-pattern"
    );

    const setMessage = (message: string) => {
        setValue("message", message);
    };

    const selectOptions: any = presetPlugins.map(item => (
        <option key={item.pattern.name} value={item.pattern.name}>
            {item.pattern.label}
        </option>
    ));

    return (
        <Grid>
            <Cell span={3}>
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
                    <Select label={"Preset"}>
                        <option value={"custom"}>Custom</option>
                        {selectOptions}
                    </Select>
                </Bind>
            </Cell>
            <Cell span={7}>
                <Bind name={"settings.regex"} validators={validation.create("required")}>
                    <Input
                        disabled={inputsDisabled}
                        label={"Regex"}
                        description={"Regex to test the value"}
                    />
                </Bind>
            </Cell>
            <Cell span={2}>
                <Bind name={"settings.flags"} validators={validation.create("required")}>
                    <Input disabled={inputsDisabled} label={"Flags"} description={"Regex flags"} />
                </Bind>
            </Cell>
        </Grid>
    );
};

const plugin: CmsEditorFieldValidatorPlugin = {
    type: "cms-editor-field-validator",
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
        }
    }
};
export default plugin;
