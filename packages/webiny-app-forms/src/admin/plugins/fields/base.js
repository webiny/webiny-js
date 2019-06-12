import React from "react";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";
import { ReactComponent as HiddenIcon } from "./icons/round-visibility_off-24px.svg";

export default [
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-text",
        fieldType: {
            dataType: true,
            id: "text",
            validators: ["required", "minLength", "maxLength", "pattern", "in"],
            label: "Text",
            description: "Titles, names, paragraphs",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-rich-text",
        fieldType: {
            dataType: true,
            id: "rich-text",
            validators: ["required"],
            label: "Rich Text",
            description: "Articles or any other type of longer text",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-number",
        fieldType: {
            dataType: true,
            id: "number",
            label: "Number",
            description: "ID, order number, rating, quantity",
            icon: <NumberIcon />,
            validators: ["required", "gte", "lte", "in"],
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-select",
        fieldType: {
            dataType: true,
            id: "select",
            validators: ["required"],
            label: "Select",
            description: "Give users the ability to choose one option",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-radio",
        fieldType: {
            dataType: true,
            id: "radio",
            validators: ["required"],
            label: "Radio buttons",
            description: "Give users the ability to choose one option",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-checkbox",
        fieldType: {
            dataType: true,
            id: "checkbox",
            validators: ["required"],
            label: "Checkbox",
            description: "For Simple yes / no questions",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-checkboxes",
        fieldType: {
            dataType: true,
            id: "checkboxes",
            validators: ["required", "minLength", "maxLength"],
            label: "Checkboxes",
            description: "Give users ability to choose one or more options",
            icon: <TextIcon />,
            createField() {
                return {
                    id: "",
                    label: "",
                    type: this.id,
                    validation: []
                };
            }
        }
    },
    {
        type: "form-editor-field-type",
        name: "form-editor-field-type-hidden",
        fieldType: {
            dataType: true,
            id: "hidden",
            label: "Hidden",
            description: "Predefined values, campaign IDs, tracking codes",
            icon: <HiddenIcon />,
            validators: ["required", "in", "pattern"],
            createField() {
                return {
                    id: "",
                    type: this.id,
                    validation: []
                };
            },
            renderSettings({ Bind, slugify, uniqueId }) {
                return (
                    <Grid>
                        <Cell span={6}>
                            <Bind
                                name={"label"}
                                validators={["required"]}
                                afterChange={slugify("id")}
                            >
                                <Input label={"Label"} />
                            </Bind>
                        </Cell>
                        <Cell span={6}>
                            <Bind name={"id"} validators={["required", uniqueId]}>
                                <Input label={"Field ID"} />
                            </Bind>
                        </Cell>
                        <Cell span={12}>
                            <Bind name={"defaultValue"}>
                                <Input
                                    label={"Default value"}
                                    description={"Default value (optional)"}
                                />
                            </Bind>
                        </Cell>
                    </Grid>
                );
            }
        }
    }
];
