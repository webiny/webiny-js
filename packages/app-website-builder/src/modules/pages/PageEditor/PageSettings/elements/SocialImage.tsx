import React from "react";
import { FileManager } from "@webiny/app-admin";
import { Grid, FilePicker } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";
import { fileManagerItemToValue } from "~/shared/fileManagerItemToValue.js";

export const SocialImage = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.social.image"}>
                {({ value, onChange }) => (
                    <FileManager
                        images={true}
                        render={({ showFileManager }) => (
                            <FilePicker
                                label={"Image"}
                                description="Select an image for social platforms (og:image)"
                                type="compact"
                                value={value}
                                onSelectItem={() =>
                                    showFileManager(file => {
                                        onChange(fileManagerItemToValue(file));
                                    })
                                }
                                onRemoveItem={() => onChange(undefined)}
                            />
                        )}
                    />
                )}
            </Bind>
        </Grid.Column>
    );
};
