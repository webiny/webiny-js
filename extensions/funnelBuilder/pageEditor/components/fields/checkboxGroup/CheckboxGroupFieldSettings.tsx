import React from "react";
import { Grid } from "webiny/admin/ui";
import OptionsList from "../components/fieldSettings/OptionsList";

export const CheckboxGroupFieldSettings = () => {
    return (
        <Grid>
            <Grid.Column span={12}>
                <OptionsList multiple />
            </Grid.Column>
        </Grid>
    );
};
