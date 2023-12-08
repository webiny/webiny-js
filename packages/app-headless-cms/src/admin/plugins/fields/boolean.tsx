import React from "react";
import { ReactComponent as BooleanIcon } from "@material-design-icons/svg/outlined/toggle_on.svg";
import { CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Cell, Grid } from "@webiny/ui/Grid";
import { Bind } from "@webiny/form";
import { Radio, RadioGroup } from "@webiny/ui/Radio";

const t = i18n.ns("app-headless-cms/admin/fields");

interface OptionsProps {
    onChange: (value: boolean) => void;
    value?: boolean | "true" | "false";
}

const Options = ({ onChange, value: initialValue }: OptionsProps) => {
    const value = initialValue === true || initialValue === "true";

    return (
        <RadioGroup label={"Default value"}>
            {() => {
                return (
                    <>
                        <div>
                            <Radio
                                label="True"
                                value={value}
                                onChange={() => {
                                    onChange(true);
                                }}
                            />
                        </div>
                        <div>
                            <Radio
                                label="False"
                                value={!value}
                                onChange={() => {
                                    onChange(false);
                                }}
                            />
                        </div>
                    </>
                );
            }}
        </RadioGroup>
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
        allowMultipleValues: false,
        allowPredefinedValues: false,
        multipleValuesLabel: t`Use as a list of booleans`,
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
                    <Cell span={12}>
                        <Bind name={"settings.defaultValue"}>
                            {bind => {
                                return <Options onChange={bind.onChange} value={bind.value} />;
                            }}
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
