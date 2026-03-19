import React from "react";
import { Grid, Input, Select } from "webiny/admin/ui";
import { Bind, useForm } from "webiny/admin/form";
import { required } from "../../../utils/validators";
import { patternPresets } from "./PatternFieldValidatorPlugin/patternPresets";
import { FieldValidatorDefinition, FieldValidatorSettingsProps } from "./index";

const ValidatorSettings = ({ setMessage }: FieldValidatorSettingsProps) => {
    const { setValue, data } = useForm();
    const inputsDisabled = data.params.extra.preset !== "custom";

    const selectOptions = [
        { label: "Custom", value: "custom" },
        ...patternPresets.map(pattern => ({ label: pattern.name, value: pattern.type }))
    ];

    return (
        <Grid>
            <Grid.Column span={3}>
                <Bind
                    name={"params.extra.preset"}
                    validators={required}
                    afterChange={value => {
                        if (value === "custom") {
                            setMessage("Invalid value.");
                            return;
                        }

                        setValue("params.extra.regex", null);
                        setValue("params.extra.flags", null);

                        const selectedPreset = patternPresets.find(preset => preset.type === value);
                        if (!selectedPreset) {
                            return;
                        }

                        setMessage(selectedPreset.defaultErrorMessage);
                    }}
                >
                    <Select
                        label={"Preset"}
                        options={selectOptions}
                        description={"Preset or custom regex"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={7}>
                <Bind name={"params.extra.regex"} validators={required}>
                    <Input
                        disabled={inputsDisabled}
                        label={"Regex"}
                        description={"Regex to test the value"}
                    />
                </Bind>
            </Grid.Column>
            <Grid.Column span={2}>
                <Bind name={"params.extra.flags"} validators={required}>
                    <Input disabled={inputsDisabled} label={"Flags"} description={"Regex flags"} />
                </Bind>
            </Grid.Column>
        </Grid>
    );
};

export const patternFieldValidator: FieldValidatorDefinition = {
    validatorType: "pattern",
    label: "Pattern",
    description: "Entered value must match a specific pattern.",
    settingsRenderer: ValidatorSettings
};
