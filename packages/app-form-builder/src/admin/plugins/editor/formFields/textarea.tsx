import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Input } from "@webiny/ui/Input";
import { FbBuilderFieldPlugin } from "../../../../types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-textarea",
    field: {
        name: "textarea",
        type: "textarea",
        validators: ["required", "minLength", "maxLength", "pattern"],
        label: "Long Text",
        description: "Descriptions, comments or paragraphs or text",
        icon: <TextIcon />,
        createField() {
            return {
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
                                rows={4}
                                label={"Default value"}
                                description={"Default value (optional)"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"settings.rows"}>
                            <Input
                                type={"number"}
                                label={"Text area rows"}
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
