import React from "react";
import { ReactComponent as BooleanIcon } from "@material-design-icons/svg/outlined/toggle_on.svg";
import { CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { Bind } from "@webiny/form";

const t = i18n.ns("app-headless-cms/admin/fields");

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
                }
            };
        },
        renderSettings() {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"settings.defaultValue"}>
                            <Select
                                label={t`Default value`}
                                description={"Default value for the field"}
                            >
                                <option value={"true"}>True</option>
                                <option value={""}>False</option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
