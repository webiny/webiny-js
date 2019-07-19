import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import { I18NInput } from "webiny-app-i18n/admin/components";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-textarea",
    field: {
        name: "textarea",
        type: "textarea",
        validators: ["required", "minLength", "maxLength", "pattern", "in"],
        label: "Long Test",
        description: "Descriptions, comments or paragraphs or text",
        icon: <TextIcon />,
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
