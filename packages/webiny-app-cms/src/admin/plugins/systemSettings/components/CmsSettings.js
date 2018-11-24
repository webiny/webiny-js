// @flow
import * as React from "react";
import { compose } from "recompose";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { Grid, Cell } from "webiny-ui/Grid";
import { Input } from "webiny-ui/Input";
import Image from "./Image";

const CmsSettings = ({ Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"general.name"}>
                        <DelayedOnChange>
                            <Input validators={["required", "url"]} label="Website name" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"general.favicon"}>
                        <Image label="Favicon" />
                    </Bind>
                </Cell>
                <Cell span={6}>
                    <Bind name={"general.logo"}>
                        <Image label="Logo" />
                    </Bind>
                </Cell>
            </Grid>
            <br />
            <Grid>
                <Cell span={12}>
                    <Bind name={"social.facebook"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Facebook" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"social.twitter"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Twitter" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
                <Cell span={12}>
                    <Bind name={"social.instagram"} validators={["url"]}>
                        <DelayedOnChange>
                            <Input label="Instagram" />
                        </DelayedOnChange>
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default compose()(CmsSettings);
