import React from "react";
import { ReactComponent as TextIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { CmsModelFieldTypePlugin } from "~/types";
import { i18n } from "@webiny/app/i18n";
import { Input } from "@webiny/ui/Input";
import PredefinedValuesDynamicFieldset from "./PredefinedValuesDynamicFieldset";
import { Bind } from "@webiny/form";
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
        allowMultipleValues: true,
        allowPredefinedValues: true,
        multipleValuesLabel: t`Use as a list of texts`,
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
                <PredefinedValuesDynamicFieldset {...props}>
                    <Input label={t`Value`} />
                </PredefinedValuesDynamicFieldset>
            );
        }
    }
};

export default plugin;
