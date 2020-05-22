import React from "react";
import { ReactComponent as LongTextIcon } from "./icons/round-notes.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-long-text",
    field: {
        type: "long-text",
        validators: ["required", "minLength", "maxLength", "pattern"],
        label: t`Long text`,
        description: t`Long comments, notes, multi line values.`,
        icon: <LongTextIcon />,
        allowMultipleValues: true,
        allowPredefinedValues: true,
        allowIndexes: {
            singleValue: false,
            multipleValues: false
        },
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings({ form: { Bind } }) {
            return (
                <Grid>
                    <Cell span={12}>
                        <Bind name={"placeholderText"}>
                            <I18NInput
                                label={t`Placeholder text`}
                                description={t`Placeholder text (optional)`}
                            />
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
