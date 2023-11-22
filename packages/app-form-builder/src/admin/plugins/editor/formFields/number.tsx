import React from "react";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { FbBuilderFieldPlugin } from "../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-number",
    field: {
        type: "number",
        name: "number",
        label: "Number",
        description: "ID, order number, rating, quantity",
        icon: <NumberIcon />,
        validators: ["required", "gte", "lte", "in"],
        createField() {
            return {
                _id: "",
                fieldId: "",
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
                }
            };
        },
        renderSettings({ form: { Bind } }) {
            // TODO: @ts-adrian: spread Bind komponente na donju komponentu
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <Input
                                label={"Placeholder text"}
                                description={"Placeholder text (optional)"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
