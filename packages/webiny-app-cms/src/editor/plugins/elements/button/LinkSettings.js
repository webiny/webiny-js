import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { isEqual } from "lodash";
import { get, merge } from "dot-prop-immutable";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Switch } from "webiny-ui/Switch";
import { Input } from "webiny-ui/Input";
import { Grid, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { DelayedOnChange } from "webiny-app-cms/editor/components/DelayedOnChange";
import { updateElement } from "webiny-app-cms/editor/actions";
import { Form } from "webiny-form";

class LinkSettings extends React.Component<*> {
    historyUpdated = {};

    updateSettings = data => {
        const { element, updateElement } = this.props;
        const attrKey = `settings.advanced.link`;

        const newElement = merge(element, attrKey, data);

        updateElement({ element: newElement, history });

        if (!isEqual(this.historyUpdated, data)) {
            this.historyUpdated = data;
            updateElement({ element: newElement });
        }
    };

    render() {
        const { element } = this.props;
        const { href, newTab } = get(element, "settings.advanced.link") || {};

        return (
            <Tabs>
                <Tab label={"Link"}>
                    <Form data={{ href, newTab }} onChange={this.updateSettings}>
                        {({ Bind }) => (
                            <React.Fragment>
                                <Grid>
                                    <Cell span={12}>
                                        <Bind name={"href"} validators={["url"]}>
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
    }
}

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withActiveElement()
)(LinkSettings);
