//@flow
import React from "react";
import { connect } from "react-redux";
import { compose } from "recompose";
import { Tabs, Tab } from "webiny-ui/Tabs";
import { get, set } from "dot-prop-immutable";
import { updateElement } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import ColorPicker from "webiny-app-cms/editor/components/ColorPicker";
import { Cell, Grid } from "webiny-ui/Grid";
import { Select } from "webiny-ui/Select";
import BackgroundImage from "./BackgroundImage";
import BackgroundPositionSelector from "./BackgroundPositionSelector";
import { omit } from "lodash";

const backgroundStyles = {
    scaling: {
        cover: {
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat"
        },
        contain: {
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat"
        },
        originalSize: {
            backgroundSize: "auto",
            backgroundRepeat: "no-repeat"
        },
        tile: {
            backgroundSize: "auto",
            backgroundRepeat: "repeat"
        },
        tileHorizontally: {
            backgroundSize: "auto",
            backgroundRepeat: "repeat-x"
        },
        tileVertically: {
            backgroundSize: "auto",
            backgroundRepeat: "repeat-y"
        }
    }
};

class Settings extends React.Component<*> {
    image = {
        setImage: image => {
            const { element, updateElement } = this.props;

            let style = { ...element.settings.style };
            if (image) {
                style = {
                    ...style,
                    ...backgroundStyles.scaling.cover,
                    backgroundImage: `url("${image.src}")`,
                    backgroundPosition: "center center"
                };
            } else {
                style = omit(style, ["backgroundImage", "backgroundSize", "backgroundRepeat"]);
            }

            updateElement({
                element: set(element, "settings.style", style),
                history: true
            });
        },
        getSrcFromCss: (value: ?string): ?Object => {
            if (!value) {
                return null;
            }

            const match = value.match(/url\("(.*?)"\)/);
            return { src: Array.isArray(match) ? match[1] : "" };
        },
        setScaling: (value: string) => {
            const { element, updateElement } = this.props;

            const style = {
                ...element.settings.style,
                ...backgroundStyles.scaling[value]
            };
            updateElement({
                element: set(element, "settings.style", style),
                history: true
            });
        },
        getScaling: () => {
            const style = get(this.props.element, "settings.style") || {};
            if (style.backgroundSize !== "auto") {
                return style.backgroundSize;
            }

            switch (style.backgroundRepeat) {
                case "no-repeat":
                    return "originalSize";
                case "repeat":
                    return "tile";
                case "repeat-x":
                    return "tileHorizontally";
                case "repeat-y":
                    return "tileVertically";
            }
        },
        setPosition: (backgroundPosition: string) => {
            const { element, updateElement } = this.props;
            updateElement({
                element: set(element, "settings.style", {
                    ...element.settings.style,
                    backgroundPosition
                }),
                history: true
            });
        },
        getPosition: () => {
            const { element } = this.props;
            return get(element, "settings.style.backgroundPosition");
        }
    };

    color = {
        setColor: (value, history) => {
            const { element, updateElement } = this.props;
            updateElement({
                element: set(element, "settings.style.backgroundColor", value),
                history
            });
        }
    };

    render() {
        const {
            element: { settings }
        } = this.props;

        const hasBackgroundImage = get(settings, "style.backgroundImage");

        return (
            <React.Fragment>
                <Tabs>
                    <Tab label={"Color"}>
                        <Grid>
                            <Cell span={12}>
                                <ColorPicker
                                    value={get(settings, "style.backgroundColor", "#fff")}
                                    onChange={value => this.color.setColor(value, false)}
                                    onChangeComplete={value => this.color.setColor(value)}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                    <Tab label={"Image"}>
                        <Grid>
                            <Cell span={12}>
                                <BackgroundImage
                                    onChange={this.image.setImage}
                                    value={this.image.getSrcFromCss(
                                        get(settings, "style.backgroundImage")
                                    )}
                                />
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <Select
                                    disabled={!hasBackgroundImage}
                                    label="Scaling"
                                    value={this.image.getScaling()}
                                    onChange={this.image.setScaling}
                                >
                                    <option value="cover">Cover</option>
                                    <option value="contain">Contain</option>
                                    <option value="originalSize">Original size</option>
                                    <option value="tile">Tile</option>
                                    <option value="tileHorizontally">Tile Horizontally</option>
                                    <option value="tileVertically">Tile Vertically</option>
                                </Select>
                            </Cell>
                        </Grid>
                        <Grid>
                            <Cell span={12}>
                                <BackgroundPositionSelector
                                    disabled={!hasBackgroundImage}
                                    value={this.image.getPosition()}
                                    onChange={this.image.setPosition}
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
        state => ({ element: getActiveElement(state) }),
        { updateElement }
    )
)(Settings);
