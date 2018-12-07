// @flow
import * as React from "react";
import { Grid, Cell } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import { withTheme } from "webiny-app-cms/theme";
import MailchimpElement from "./MailchimpElement";

const MailchimpSettings = ({ theme, Bind }: Object) => {
    return (
        <React.Fragment>
            <Grid>
                <Cell span={12}>
                    <Bind name={"settings.component"} validators={["required"]}>
                        <Select
                            label={"Mailchimp component"}
                            description={"Select a component to render the list"}
                        >
                            {theme.elements.mailchimp.components.map(cmp => (
                                <option key={cmp.name} value={cmp.name}>
                                    {cmp.title}
                                </option>
                            ))}
                        </Select>
                    </Bind>
                </Cell>
            </Grid>
            <Grid>
                <Cell span={12} style={{ overflowY: "scroll" }}>
                    <Bind name={"settings"}>
                        {({ value }) => <MailchimpElement element={{ settings: value }} />}
                    </Bind>
                </Cell>
            </Grid>
        </React.Fragment>
    );
};

export default withTheme()(MailchimpSettings);
