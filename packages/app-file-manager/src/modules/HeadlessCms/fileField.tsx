import React from "react";
import { ReactComponent as FileIcon } from "@webiny/icons/file_present.svg";
import type { CmsModelFieldTypePlugin } from "@webiny/app-headless-cms/types.js";
import { Grid, Switch } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const fileField: CmsModelFieldTypePlugin = {
    type: "cms-editor-field-type",
    name: "cms-editor-field-type-file",
    field: {
        type: "file",
        label: "Files",
        description: "Images, videos and other files.",
        icon: <FileIcon />,
        validators: ["required"],
        listValidators: ["minLength", "maxLength"],
        allowList: true,
        allowPredefinedValues: false,
        listLabel: "Use as a list of files or an image gallery",
        createField() {
            return {
                type: this.type,
                validation: [],
                renderer: {
                    name: ""
                }
            };
        },
        renderSettings: () => {
            return (
                <Grid>
                    <Grid.Column span={12}>
                        <Bind name={"settings.imagesOnly"}>
                            <Switch
                                label={"Images only"}
                                description={"Allow only images to be selected"}
                            />
                        </Bind>
                    </Grid.Column>
                </Grid>
            );
        }
    }
};
