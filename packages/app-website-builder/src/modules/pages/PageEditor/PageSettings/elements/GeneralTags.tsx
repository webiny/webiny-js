import React from "react";
import { Grid } from "@webiny/admin-ui";
import { SimpleTags } from "~/modules/pages/PageEditor/TopBar/Settings/SimpleTags.js";

export const GeneralTags = () => {
    return (
        <Grid.Column span={12}>
            <SimpleTags
                bindName={"properties.tags"}
                label={"Tags"}
                description={
                    "Add page tags. These can be used for page rendering, filtering, etc."
                }
            />
        </Grid.Column>
    );
};
