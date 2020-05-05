import React from "react";
import { ReactComponent as DateTimeIcon } from "./icons/schedule-black-24px.svg";
import { Grid, Cell } from "@webiny/ui/Grid";
import { I18NInput } from "@webiny/app-i18n/admin/components";
import { FbBuilderFieldPlugin } from "@webiny/app-headless-cms/types";
import { i18n } from "@webiny/app/i18n";
const t = i18n.ns("app-headless-cms/fields");

const plugin: FbBuilderFieldPlugin = {
    type: "content-model-editor-field-type",
    name: "content-model-editor-field-type-dateTime",
    field: {
        type: "dateTime",
        label: t`Date/Time`,
        description: t`Store date and time.`,
        icon: <DateTimeIcon />,
        validators: ["required", "gte", "lte"],
        createField() {
            return {
                type: this.type,
                name: this.name,
                validation: [],
                settings: {
                    defaultValue: ""
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
