import React from "react";
import { Tags } from "webiny-ui/Tags";
import { Input } from "webiny-ui/Input";
import { Select } from "webiny-ui/Select";
import { Grid, Cell } from "webiny-ui/Grid";

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

export default [
    {
        type: "form-editor-field-validator",
        name: "form-editor-field-validator-required",
        validator: {
            id: "required",
            label: "Required",
            description: "You won't be able to submit the form if this field is empty",
            renderSettings({ Bind }) {
                return (
                    <Grid>
                        <Cell span={12}>
                            <Bind
                                name={"message"}
                                validators={["required"]}
                                defaultValue={"Value is required."}
                            >
                                <Input
                                    label={"Message"}
                                    description={"This message will be displayed to the user"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    },
    {
        type: "form-editor-field-validator",
        name: "form-editor-field-validator-in",
        validator: {
            id: "in",
            label: "Specific values",
            description:
                "You won't be able to submit the form if the field value is not in the list of specified values",
            renderSettings({ Bind }) {
                return (
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"values"} validators={["required"]}>
                                <Tags
                                    label={"Allowed values"}
                                    description={"Hit ENTER to add values"}
                                />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind
                                name={"message"}
                                validators={["required"]}
                                defaultValue={"Value is not allowed."}
                            >
                                <Input
                                    label={"Message"}
                                    description={"This message will be displayed to the user"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    },
    {
        type: "form-editor-field-validator",
        name: "form-editor-field-validator-gte",
        validator: {
            id: "gte",
            label: "Greater or equal",
            description:
                "Entered value must be greater than the one configured to submit the form.",
            renderSettings({ Bind }) {
                return (
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"value"} validators={["required", "numeric"]}>
                                <Input
                                    label={"Value"}
                                    description={"This is the smallest value that will be allowed"}
                                />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind
                                name={"message"}
                                validators={["required"]}
                                defaultValue={"Value is too small."}
                            >
                                <Input
                                    label={"Message"}
                                    description={"This message will be displayed to the user"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    },
    {
        type: "form-editor-field-validator",
        name: "form-editor-field-validator-lte",
        validator: {
            id: "lte",
            label: "Smaller or equal",
            description:
                "Entered value must be smaller than the one configured to submit the form.",
            renderSettings({ Bind }) {
                return (
                    <Grid>
                        <Cell span={12}>
                            <Bind name={"value"} validators={["required", "numeric"]}>
                                <Input
                                    label={"Value"}
                                    description={"This is the greatest value that will be allowed"}
                                />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind
                                name={"message"}
                                validators={["required"]}
                                defaultValue={"Value is too big."}
                            >
                                <Input
                                    label={"Message"}
                                    description={"This message will be displayed to the user"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    },
    {
        type: "form-editor-field-validator",
        name: "form-editor-field-validator-pattern",
        validator: {
            id: "pattern",
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
                                <Input
                                    label={"Message"}
                                    description={"This message will be displayed to the user"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    }
];
