//@flow
import * as React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { Slider } from "webiny-ui/Slider";
import { Select } from "webiny-ui/Select";
import { get, set } from "dot-prop-immutable";
import { withActiveElement } from "webiny-app-cms/editor/components";
import { updateElement } from "webiny-app-cms/editor/actions";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { Typography } from "webiny-ui/Typography";
import { Grid, Cell } from "webiny-ui/Grid";

type Props = {
    element: Object,
    updateElement: Function
};

class Settings extends React.Component<Props> {
    historyUpdated = {};

    updateSettings = (name, value, history = true) => {
        const { element, updateElement } = this.props;
        const attrKey = `settings.style.${name}`;

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
        const { element } = this.props;
        const { settings } = element;

        const borderWidth = get(settings, "style.borderWidth", 0);
        const borderRadius = get(settings, "style.borderRadius", 0);
        const borderColor = get(settings, "style.borderColor", "#fff");
        const borderStyle = get(settings, "style.borderStyle", "none");

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Border"}>
                        <Grid>
                            <Cell span={4}>
                                <Typography use={"overline"}>Width</Typography>
                            </Cell>
                            <Cell span={8}>
                                <Slider
                                    value={borderWidth}
                                    onChange={value => this.updateSettings("borderWidth", value)}
                                    onInput={value =>
                                        this.updateSettings("borderWidth", value, false)
                                    }
                                    discrete
                                    step={1}
                                    min={0}
                                    max={20}
                                />
                            </Cell>
                            <Cell span={4}>
                                <Typography use={"overline"}>Radius</Typography>
                            </Cell>
                            <Cell span={8}>
                                <Slider
                                    value={borderRadius}
                                    onChange={value => this.updateSettings("borderRadius", value)}
                                    onInput={value =>
                                        this.updateSettings("borderRadius", value, false)
                                    }
                                    min={0}
                                    max={100}
                                    discrete
                                    step={1}
                                />
                            </Cell>

                            <Cell span={4}>
                                <Typography use={"overline"}>Style</Typography>
                            </Cell>
                            <Cell span={8}>
                                <Select
                                    value={borderStyle}
                                    onChange={value => this.updateSettings("borderStyle", value)}
                                    options={["none", "solid", "dashed", "dotted"]}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                    <Tab label={"Color"}>
                        <Grid>
                            <Cell span={12}>
                                <ColorPicker
                                    value={borderColor}
                                    onChange={value => this.updateSettings("borderColor", value)}
                                    onChangeComplete={value =>
                                        this.updateSettings("borderColor", value, true)
                                    }
                                />
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
        null,
        { updateElement }
    ),
    withActiveElement()
)(Settings);
