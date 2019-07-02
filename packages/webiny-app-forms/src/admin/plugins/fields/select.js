import React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { ReactComponent as Icon } from "./icons/dropdown-icon.svg";
import OptionsSelectionDynamicFieldset from "./components/OptionsSelectionDynamicFieldset";
import { I18NInput } from "webiny-app-i18n/components";

export default {
    type: "form-editor-field-type",
    name: "form-editor-field-type-select",
    fieldType: {
        dataType: true,
        id: "select",
        validators: ["required"],
        label: "Select",
        description: "Dropdown, select one of the options",
        icon: <Icon />,
        createField() {
            return {
                id: "",
                label: "",
                type: this.id,
                defaultValue: "",
                validation: []
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
                        <OptionsSelectionDynamicFieldset form={form} />
                    </Cell>
                </Grid>
            );
        }
    }
};
