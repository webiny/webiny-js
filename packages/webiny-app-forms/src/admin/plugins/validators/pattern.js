import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/components";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";

const patterns = {
    custom: { regex: "", flags: "", message: "Value does not match the required pattern." },
    email: {
        regex: "^\\w[\\w.-]*@([\\w-]+\\.)+[\\w-]+$",
        flags: "i",
        message: "Please enter a valid email address."
    },
    url: {
        regex:
            "^(ftp|http|https):\\/\\/(\\w+:{0,1}\\w*@)?(\\S+)(:[0-9]+)?(\\/|\\/([\\w#!:.?+=&%@!\\-\\/]))?$",
        flags: "i",
        message: "Please enter a valid URL."
    }
};

export default {
    type: "form-editor-field-validator",
    name: "form-editor-field-validator-pattern",
    validator: {
        name: "pattern",
        label: "Pattern",
        description: "Entered value must match a specific pattern.",
        renderSettings({ Bind, setValue, data }) {
            const hide = { display: data.preset !== "custom" ? "none" : "block" };
            return (
                <Grid>
                    <Cell span={3}>
                        <Bind
                            name={"preset"}
                            validators={["required"]}
                            afterChange={value => {
                                if (value !== "") {
                                    const { regex, flags, message } = patterns[value];
                                    setValue("regex", regex);
                                    setValue("flags", flags);
                                    setValue("message", message);
                                }
                            }}
                        >
                            <Select label={"Preset"} placeholder={"Select a preset"}>
                                <option value={"custom"}>Custom</option>
                                <option value={"url"}>URL</option>
                                <option value={"email"}>Email</option>
                            </Select>
                        </Bind>
                    </Cell>
                    <Cell span={7} style={hide}>
                        <Bind name={"regex"} validators={["required"]}>
                            <Input label={"Regex"} description={"Regex to test the value"} />
                        </Bind>
                    </Cell>
                    <Cell span={2} style={hide}>
                        <Bind name={"flags"} validators={["required"]}>
                            <Input label={"Flags"} description={"Regex flags"} />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"message"} validators={["required"]}>
                            <I18NInput
                                label={"Message"}
                                description={"This message will be displayed to the user"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
