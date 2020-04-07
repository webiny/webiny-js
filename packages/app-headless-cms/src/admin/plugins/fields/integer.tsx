import React from "react";
import { ReactComponent as IntegerIcon } from "./icons/round-looks_3-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-integer",
    field: {
        type: "integer",
        name: "integer",
        label: "Integer",
        description: "ID, order integer, rating, quantity",
        icon: <IntegerIcon />,
        validators: ["required", "gte", "lte", "in"],
        createField() {
            return {
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
                }
            };
        },
        renderSettings({ form: { Bind } }) {
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

export default plugin;
