import React from "react";
import { Grid, Switch } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SeoNoIndex = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.seo.noIndex"} defaultValue={false}>
                <Switch
                    label={"No Index"}
                    description={"Whether this page should be indexed by search engines"}
                />
            </Bind>
        </Grid.Column>
    );
};
