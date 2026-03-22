import React from "react";
import { Grid, Textarea } from "@webiny/admin-ui";
import { Bind } from "@webiny/form";

export const SocialDescription = () => {
    return (
        <Grid.Column span={12}>
            <Bind name={"properties.social.description"}>
                <Textarea
                    label={"Description"}
                    description={"Description for social platforms (og:description)"}
                />
            </Bind>
        </Grid.Column>
    );
};
