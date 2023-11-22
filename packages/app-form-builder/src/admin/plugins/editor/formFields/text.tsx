import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { FbBuilderFieldPlugin } from "../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-text",
    field: {
        name: "text",
        type: "text",
        validators: ["required", "minLength", "maxLength", "pattern"],
        label: "Short Text",
        description: "Titles, names, single line input",
        icon: <TextIcon />,
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
                    <Cell span={12}>
                        <Bind name={"settings.defaultValue"}>
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
};

export default plugin;
