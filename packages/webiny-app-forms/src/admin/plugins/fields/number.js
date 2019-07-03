import React from "react";
import { ReactComponent as NumberIcon } from "./icons/round-looks_3-24px.svg";
import { Grid, Cell } from "webiny-ui/Grid";
import { I18NInput } from "webiny-app-i18n/components";

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
                _id: "",
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
                            <I18NInput
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
