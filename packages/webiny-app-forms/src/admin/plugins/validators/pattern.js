import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { getPlugins } from "webiny-plugins";

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-pattern",
    validator: {
        name: "pattern",
        label: "Pattern",
        description: "Entered value must match a specific pattern.",
        defaultMessage: "Invalid value.",
        defaultSettings: {
            preset: "custom"
        },
        renderSettings({ Bind, setValue, setMessage, data }) {
            const inputsDisabled = data.settings.preset !== "custom";
            const presetPlugins = getPlugins("form-editor-field-validator-pattern");

            return (
                <Grid>
                    <Cell span={3}>
                        <Bind
                            name={"settings.preset"}
                            validators={["required"]}
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

                                setMessage(selectedPatternPlugin.pattern.message);
                            }}
                        >
                            <Select label={"Preset"}>
                                <option value={"custom"}>Custom</option>
                                {presetPlugins.map(item => (
                                    <option key={item.pattern.name} value={item.pattern.name}>
                                        {item.pattern.label}
                                    </option>
                                ))}
                            </Select>
                        </Bind>
                    </Cell>
                    <Cell span={7}>
                        <Bind name={"settings.regex"} validators={["required"]}>
                            <Input
                                disabled={inputsDisabled}
                                label={"Regex"}
                                description={"Regex to test the value"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={2}>
                        <Bind name={"settings.flags"} validators={["required"]}>
                            <Input
                                disabled={inputsDisabled}
                                label={"Flags"}
                                description={"Regex flags"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
