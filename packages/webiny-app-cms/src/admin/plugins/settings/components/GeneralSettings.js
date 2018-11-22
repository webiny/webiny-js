// @flow
import * as React from "react";
import { compose } from "recompose";
import { withTheme } from "webiny-app-cms/theme";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import Image from "./Image";

const GeneralSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"websiteName"}>
                        <DelayedOnChange>
                            <Input validators={["required", "url"]} label="Website name" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"settings.general.favicon"}>
                        <Image label="Favicon" />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"settings.general.logo"}>
                        <Image label="Logo" />
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default compose(withTheme())(GeneralSettings);
