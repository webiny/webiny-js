import React from "react";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import PredefinedValuesDynamicFieldset from "./PredefinedValuesDynamicFieldset";
import { ReactComponent as FloatIcon } from "@material-design-icons/svg/outlined/looks_3.svg";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-number",
    field: {
        type: "number",
        label: t`Number`,
        description: t`Store numbers.`,
        icon: <FloatIcon />,
        validators: ["required", "gte", "lte"],
        allowMultipleValues: true,
        allowPredefinedValues: true,
        multipleValuesLabel: t`Use as a list of numbers`,
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings() {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <Input
                                label={t`Placeholder text`}
                                description={t`Placeholder text (optional)`}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        },
        renderPredefinedValues(props) {
            return (
                <PredefinedValuesDynamicFieldset
                    {...props}
                    renderValueInput={Bind => (
                        <Bind name={"value"}>
                            {bind => (
                                <Input
                                    {...bind}
                                    type="number"
                                    label={t`Value`}
                                    onChange={value => bind.onChange(parseFloat(value))}
                                />
                            )}
                        </Bind>
                    )}
                />
            );
        }
    }
};

export default plugin;
