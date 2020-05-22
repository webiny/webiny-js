import React from "react";
import { ReactComponent as FileIcon } from "./icons/round_insert_drive_file-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Select } from "@webiny/ui/Select";
import { CmsEditorFieldTypePlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/admin/fields");

const plugin: CmsEditorFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-file",
    field: {
        type: "file",
        label: t`Media`,
        description: t`Images, videos and other files.`,
        icon: <FileIcon />,
        validators: ["required"],
        allowMultipleValues: true,
        allowPredefinedValues: false,
        allowIndexes: {
            singleValue: false,
            multipleValues: false
        },
        createField() {
            return {
                type: this.type,
                validation: [],
                settings: {
                    defaultValue: "",
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
                        <Bind name={"settings.type"}>
                            <Select label={t`Type`} description={t`Cannot be changed later`}>
                                <option value={t`single`}>{t`One file`}</option>
                                <option value={t`multiple`}>{t`Many files`}</option>
                            </Select>
                        </Bind>
                    </Cell>
                </Grid>
            );
        }
    }
};

export default plugin;
