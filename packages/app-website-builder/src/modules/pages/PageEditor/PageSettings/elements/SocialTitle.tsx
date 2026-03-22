import React from "react";
import { Grid, Input } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SocialTitle = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.social.title"}>
                <Input label={"Title"} description={"Title for social platforms (og:title)"} />
            </Bind>
        </Grid.Column>
    );
};
