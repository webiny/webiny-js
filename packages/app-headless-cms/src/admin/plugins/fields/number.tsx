import React from "react";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import PredefinedValuesDynamicFieldset from "./PredefinedValuesDynamicFieldset.js";
import { ReactComponent as FloatIcon } from "@webiny/icons/looks_3.svg";
import { Bind } from "@webiny/form";
import { Grid, Input } from "@webiny/admin-ui";

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
        allowList: true,
        allowPredefinedValues: true,
        listLabel: t`Use as a list of numbers`,
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
                    <Grid.Column span={12}>
                        <Bind name={"placeholder"}>
                            <Input
                                label={t`Placeholder text`}
                                size={"lg"}
                                description={
                                    "This text will be shown in an empty input component (optional)"
                                }
                            />
                        </Bind>
                    </Grid.Column>
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
                                    size={"lg"}
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
