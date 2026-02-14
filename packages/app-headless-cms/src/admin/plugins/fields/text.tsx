import React from "react";
import { ReactComponent as TextIcon } from "@webiny/icons/text_fields.svg";
import type { CmsModelFieldTypePlugin } from "~/types.js";
import { i18n } from "@webiny/app/i18n/index.js";
import PredefinedValuesDynamicFieldset from "./PredefinedValuesDynamicFieldset.js";
import { Bind } from "@webiny/form";
import { Grid, Input } from "@webiny/admin-ui";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-text",
    field: {
        type: "text",
        validators: ["required", "minLength", "maxLength", "pattern", "unique"],
        label: t`Text`,
        description: t`Titles, names, single line values.`,
        icon: <TextIcon />,
        allowList: true,
        allowPredefinedValues: true,
        listLabel: t`Use as a list of texts`,
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
                                description={"This text will be shown in an empty input component (optional)"}
                            />
                        </Bind>
                    </Grid.Column>
                </Grid>
            );
        },
        renderPredefinedValues(props) {
            return (
                <PredefinedValuesDynamicFieldset {...props}>
                    <Input label={t`Value`} />
                </PredefinedValuesDynamicFieldset>
            );
        }
    }
};

export default plugin;
