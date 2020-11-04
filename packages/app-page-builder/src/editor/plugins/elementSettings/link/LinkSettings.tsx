import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { PbElement } from "@webiny/app-page-builder/types";
import { merge } from "dot-prop-immutable";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Switch } from "@webiny/ui/Switch";
import { Input } from "@webiny/ui/Input";
import { Grid, Cell } from "@webiny/ui/Grid";
import { Typography } from "@webiny/ui/Typography";
import { withActiveElement } from "@webiny/app-page-builder/editor/components";
import { DelayedOnChange } from "@webiny/app-page-builder/editor/components/DelayedOnChange";
import { Form } from "@webiny/form";
import { validation } from "@webiny/validation";

type LinkSettingsPropsType = {
    element: PbElement;
};
const LinkSettingsComponent: React.FunctionComponent<LinkSettingsPropsType> = ({ element }) => {
    const handler = useEventActionHandler();

    const { href, newTab } = element.data?.link || {};

    const updateElement = (element: PbElement) => {
        handler.trigger(
            new UpdateElementActionEvent({
                element
            })
        );
    };

    const updateSettings = data => {
        const attrKey = `data.link`;
        const newElement: PbElement = merge(element, attrKey, data);
        updateElement(newElement);
    };

    return (
        <Tabs>
            <Tab label={"Link"}>
                <Form data={{ href, newTab }} onChange={updateSettings}>
                    {({ Bind }) => (
                        <React.Fragment>
                            <Grid>
                                <Cell span={12}>
                                    <Bind
                                        name={"href"}
                                        validators={validation.create(
                                            "url:allowRelative:allowHref"
                                        )}
                                    >
                                        <DelayedOnChange>
                                            {props => <Input {...props} label={"URL"} />}
                                        </DelayedOnChange>
                                    </Bind>
                                </Cell>
                            </Grid>
                            <Grid>
                                <Cell span={6}>
                                    <Typography use={"overline"}>New tab</Typography>
                                </Cell>
                                <Cell span={6}>
                                    <Bind name={"newTab"}>
                                        <Switch />
                                    </Bind>
                                </Cell>
                            </Grid>
                        </React.Fragment>
                    )}
                </Form>
            </Tab>
        </Tabs>
    );
};

export default withActiveElement()(LinkSettingsComponent);
