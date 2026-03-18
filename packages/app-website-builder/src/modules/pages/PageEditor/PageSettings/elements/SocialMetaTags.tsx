import React from "react";
import { Grid } from "@webiny/admin-ui";
import { MetaTags } from "~/modules/pages/PageEditor/TopBar/Settings/MetaTags.js";

export const SocialMetaTags = () => {
    return (
        <Grid.Column span={12}>
            <MetaTags
                label={"Meta Tags"}
                description={"Add more Open Graph tags"}
                bindName={"properties.social.metaTags"}
                keyName={"property"}
                keyLabel={"Property"}
                valueName={"content"}
                valueLabel={"Content"}
            />
        </Grid.Column>
    );
};
