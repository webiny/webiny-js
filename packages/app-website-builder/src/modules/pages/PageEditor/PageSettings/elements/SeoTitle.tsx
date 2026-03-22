import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SeoTitle = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.seo.title"}>
                <Input label={"Title"} description={"SEO title"} />
            </Bind>
        </Grid.Column>
    );
};
