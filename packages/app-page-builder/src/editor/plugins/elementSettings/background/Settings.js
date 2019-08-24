//@flow
import React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { compose } from "recompose";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import ColorPicker from "@webiny/app-page-builder/editor/components/ColorPicker";
import { Cell, Grid } from "@webiny/ui/Grid";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import BackgroundPositionSelector from "./BackgroundPositionSelector";
import { css } from "emotion";

const imageSelect = css({
    width: "100%"
});

const root = "data.settings.background";

class Settings extends React.Component<*> {
    setImage = image => {
        const { element, updateElement } = this.props;

        if (!image) {
            updateElement({
                element: set(element, `${root}.image.file`, null),
                history: true
            });
        } else {
            updateElement({
                element: set(element, `${root}.image.file`, image),
                history: true
            });
        }
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
        const imageSrc = get(bg, "image.file.src");

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
                                        value={{ src: imageSrc }}
                                    />
                                </Cell>
                            </Grid>
                            <Select
                                disabled={!imageSrc}
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
                                        disabled={!imageSrc}
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
