//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { Cell, Grid } from "webiny-ui/Grid";

class Settings extends React.Component<*> {
    updateSettings = (value, history = true) => {
        const { element, updateElement } = this.props;
        updateElement({ element: set(element, "settings.style.backgroundColor", value), history });
    };

    render() {
        const { element } = this.props;
        const { settings } = element;

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Color"}>
                        <Grid>
                            <Cell span={12}>
                                <ColorPicker
                                    value={get(settings, "style.backgroundColor", "#fff")}
                                    onChange={v => this.updateSettings(v, false)}
                                    onChangeComplete={v => this.updateSettings(v)}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                    <Tab label={"Image"}>
                        <Grid>
                            <Cell span={12}>Image</Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        null,
        { updateElement }
    ),
    withActiveElement()
)(Settings);
