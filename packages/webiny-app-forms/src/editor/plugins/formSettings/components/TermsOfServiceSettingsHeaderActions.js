// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Switch } from "webiny-ui/Switch";

const TermsOfServiceSettingsHeaderActions = ({ Bind }: Object) => {
    return (
        <Grid>
            <Cell span={12}>
                <Bind name={"termsOfServiceMessage.enabled"}>
                    <Switch label={"Enabled"} />
                </Bind>
            </Cell>
        </Grid>
    );
};

export default TermsOfServiceSettingsHeaderActions;
