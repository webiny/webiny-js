import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { ReactComponent as Icon } from "./icons/dropdown-icon.svg";
import OptionsList from "./components/OptionsList";
import { Input } from "@webiny/ui/Input";
import { FbBuilderFieldPlugin } from "~/types";

const plugin: FbBuilderFieldPlugin = {
    type: "form-editor-field-type",
    name: "form-editor-field-type-select",
    field: {
        type: "select",
        name: "select",
        validators: ["required"],
        label: "Select",
        description: "Dropdown, select one of the options",
        icon: <Icon />,
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
        renderSettings({ form }) {
            const { Bind } = form;
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
                    <Cell span={12}>
                        <OptionsList form={form} />
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
