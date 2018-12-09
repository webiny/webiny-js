// @flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { set } from "dot-prop-immutable";
import { get } from "lodash";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Select } from "webiny-ui/Select";
import { Grid, Cell } from "webiny-ui/Grid";
import { Typography } from "webiny-ui/Typography";
import { withCms } from "webiny-app-cms/context";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";

class ButtonSettings extends React.Component<*> {
    historyUpdated = {};

    updateSettings = (name, value, history = true) => {
        const { element, updateElement } = this.props;
        const attrKey = `settings.advanced.${name}`;

        const newElement = set(element, attrKey, value);

        if (!history) {
            updateElement({ element: newElement, history });
            return;
        }

        if (this.historyUpdated[name] !== value) {
            this.historyUpdated[name] = value;
            updateElement({ element: newElement });
        }
    };

    render() {
        const { element, theme } = this.props;
        const { types } = theme.elements.button;
        const { icon = {}, type = types[0].name } = get(element, "settings.advanced", {});

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Button"}>
                        <Grid>
                            <Cell span={6}>
                                <Typography use={"overline"}>Button type</Typography>
                            </Cell>
                            <Cell span={6}>
                                <Select
                                    value={type}
                                    onChange={value => this.updateSettings("type", value)}
                                >
                                    {types.map(type => (
                                        <option key={type.className} value={type.className}>
                                            {type.label}
                                        </option>
                                    ))}
                                </Select>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={6}>
                                <Typography use={"overline"}>Icon position</Typography>
                            </Cell>
                            <Cell span={6}>
                                <Select
                                    value={icon.position || "left"}
                                    onChange={pos => this.updateSettings("icon.position", pos)}
                                >
                                    <option value={"left"}>Left</option>
                                    <option value={"right"}>Right</option>
                                    <option value={"top"}>Top</option>
                                    <option value={"bottom"}>Bottom</option>
                                </Select>
                            </Cell>
                        </Grid>
                    </Tab>
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    ),
    withCms()
)(ButtonSettings);
