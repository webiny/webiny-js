//@flow
import React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { Cell, Grid } from "webiny-ui/Grid";
import Select from "webiny-app-cms/editor/plugins/elementSettings/components/Select";
import SingleImageUpload from "webiny-admin/components/SingleImageUpload";
import BackgroundPositionSelector from "./BackgroundPositionSelector";
import { css } from "emotion";

const imageSelect = css({
    width: "100%"
});

const root = "data.settings.background";

class Settings extends React.Component<*> {
    setImage = image => {
        const { element, updateElement } = this.props;

        updateElement({
            element: set(element, `${root}.image.src`, image ? image.src : null),
            history: true
        });
    };

    setScaling = (value: string) => {
        const { element, updateElement } = this.props;

        updateElement({
            element: set(element, `${root}.image.scaling`, value),
            history: true
        });
    };

    setPosition = (position: string) => {
        const { element, updateElement } = this.props;

        updateElement({
            element: set(element, `${root}.image.position`, position),
            history: true
        });
    };

    setColor = (value, history) => {
        const { element, updateElement } = this.props;
        updateElement({
            element: set(element, `${root}.color`, value),
            history
        });
    };

    render() {
        const { element, options } = this.props;

        const bg = get(element, "data.settings.background");
        const hasImage = get(bg, "image.src");

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Color"}>
                        <Grid>
                            <Cell span={12}>
                                <ColorPicker
                                    value={get(bg, "color", "#fff")}
                                    onChange={value => this.setColor(value, false)}
                                    onChangeComplete={value => this.setColor(value)}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                    {options.image !== false && (
                        <Tab label={"Image"}>
                            <Grid>
                                <Cell span={12}>
                                    <SingleImageUpload
                                        className={imageSelect}
                                        onChange={this.setImage}
                                        value={{ src: hasImage ? bg.image.src : "" }}
                                    />
                                </Cell>
                            </Grid>
                            <Select
                                disabled={!hasImage}
                                label="Scaling"
                                value={get(bg, "image.scaling")}
                                updateValue={this.setScaling}
                            >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="originalSize">Original size</option>
                                <option value="tile">Tile</option>
                                <option value="tileHorizontally">Tile Horizontally</option>
                                <option value="tileVertically">Tile Vertically</option>
                            </Select>
                            <Grid>
                                <Cell span={12}>
                                    <BackgroundPositionSelector
                                        disabled={!hasImage}
                                        value={get(bg, "image.position")}
                                        onChange={this.setPosition}
                                    />
                                </Cell>
                            </Grid>
                        </Tab>
                    )}
                </Tabs>
            </React.Fragment>
        );
    }
}

export default compose(
    connect(
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    )
)(Settings);
