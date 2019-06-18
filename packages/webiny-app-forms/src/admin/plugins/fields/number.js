import React from "react";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";

export default {
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
                validation: [],
                defaultValue: ""
            };
        },
        renderSettings({ form }) {
            const { Bind } = form;
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
