import React from "react";
import { ReactComponent as BooleanIcon } from "@webiny/icons/toggle_on.svg";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import { Bind } from "@webiny/form";
import { Grid, RadioGroup } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/fields");

interface OptionsProps {
    onChange: (value: boolean) => void;
    value?: boolean | "true" | "false";
}

const Options = ({ onChange, value: initialValue }: OptionsProps) => {
    const value = initialValue === true || initialValue === "true";

    return (
        <RadioGroup
            label={"Default value"}
            value={String(value)}
            onChange={value => {
                onChange(value === "true");
            }}
            items={[
                { value: "true", label: "True" },
                { value: "false", label: "False" }
            ]}
        />
    );
};

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-boolean",
    field: {
        type: "boolean",
        label: t`Boolean`,
        description: t`Store boolean ("yes" or "no" ) values.`,
        icon: <BooleanIcon />,
        allowList: false,
        allowPredefinedValues: false,
        listLabel: t`Use as a list of booleans`,
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                },
                settings: {
                    defaultValue: false
                }
            };
        },
        renderSettings() {
            return (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind name={"settings.defaultValue"}>
                            {bind => {
                                return <Options onChange={bind.onChange} value={bind.value} />;
                            }}
                        </Bind>
                    </Grid.Column>
                </Grid>
            );
        }
    }
};

export default plugin;
