import React from "react";
import { Grid } from "@webiny/admin-ui";
import { MetaTags } from "~/modules/pages/PageEditor/TopBar/Settings/MetaTags.js";

export const SeoMetaTags = () => {
    return (
        <Grid.Column span={12}>
            <MetaTags
                label={"Meta Tags"}
                description={"Add SEO tags"}
                bindName={"properties.seo.metaTags"}
                keyName={"name"}
                keyLabel={"Name"}
                valueName={"content"}
                valueLabel={"Content"}
            />
        </Grid.Column>
    );
};
