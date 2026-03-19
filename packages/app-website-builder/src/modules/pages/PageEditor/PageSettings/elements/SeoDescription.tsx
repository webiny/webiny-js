import React from "react";
import { Grid, Textarea } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SeoDescription = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.seo.description"}>
                <Textarea label={"Description"} description={"SEO description"} />
            </Bind>
        </Grid.Column>
    );
};
