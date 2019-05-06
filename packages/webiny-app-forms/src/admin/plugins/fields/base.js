import React from "react";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";
import { ReactComponent as HiddenIcon } from "./icons/round-visibility_off-24px.svg";

export default [
    {
        type: "cms-form-field-type",
        name: "cms-form-field-text",
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
        type: "cms-form-field-type",
        name: "cms-form-field-number",
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
        type: "cms-form-field-type",
        name: "cms-form-field-hidden",
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
