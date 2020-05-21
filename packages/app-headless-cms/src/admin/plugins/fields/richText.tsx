import React from "react";
import { ReactComponent as NotesIcon } from "./icons/round-text_fields-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-richText",
    field: {
        type: "rich-text",
        label: t`Rich text`,
        description: t`Text formatting with references and media.`,
        icon: <NotesIcon />,
        allowMultipleValues: false,
        allowPredefinedValues: false,
        allowIndexes: {
            singleValue: false,
            multipleValues: false
        },
        createField() {
            return {
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
                },
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
