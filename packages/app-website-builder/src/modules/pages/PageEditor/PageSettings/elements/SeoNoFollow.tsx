import React from "react";
import { Grid, Switch } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SeoNoFollow = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.seo.noFollow"} defaultValue={false}>
                <Switch
                    label={"No Follow"}
                    description={"Whether search engines should follow links on this page"}
                />
            </Bind>
        </Grid.Column>
    );
};
