import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-textarea",
    fieldType: {
        dataType: true,
        id: "textarea",
        validators: ["required", "minLength", "maxLength", "pattern", "in"],
        label: "Textarea",
        description: "Shorter text like for example short descriptions or comments.",
        icon: <TextIcon />,
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                validation: []
            };
        },
        renderSettings({ form }) {
            const { Bind } = form;

            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"defaultValue"}>
                            <Input
                                rows={4}
                                label={"Default value"}
                                description={"Default value (optional)"}
                            />
                        </Bind>
                    </Cell>
                    <Cell span={12}>
                        <Bind name={"rows"}>
                            <Input
                                type={"number"}
                                label={"Textarea rows"}
                                description={"Default value (optional)"}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};
