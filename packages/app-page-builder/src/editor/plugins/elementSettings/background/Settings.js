//@flow
import React, { useCallback } from "react";
import { get } from "lodash";
import { set } from "dot-prop-immutable";
import { css } from "emotion";
import { useHandlers } from "@webiny/app/hooks/useHandlers";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import ColorPicker from "@webiny/app-page-builder/editor/components/ColorPicker";
import { Cell, Grid } from "@webiny/ui/Grid";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import BackgroundPositionSelector from "./BackgroundPositionSelector";

const imageSelect = css({
    width: "100%"
});

const root = "data.settings.background";

const Settings = props => {
    const { setImage, setScaling, setPosition, setColor } = useHandlers(props, {
        setImage: ({ element, updateElement }) => image => {

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
        },
        setScaling: ({ element, updateElement }) => (value: string) => {
            updateElement({
                element: set(element, `${root}.image.scaling`, value),
                history: true
            });
        },
        setPosition: ({ element, updateElement }) => (position: string) => {
            updateElement({
                element: set(element, `${root}.image.position`, position),
                history: true
            });
        },
        setColor: ({ element, updateElement }) => (value, history) => {
            updateElement({
                element: set(element, `${root}.color`, value),
                history
            });
        }
    });

    const onColorChange = useCallback(value => setColor(value, false), [setColor]);
    const onColorChangeComplete = useCallback(value => setColor(value), [setColor]);

    const { element, options } = props;
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
                                onChange={onColorChange}
                                onChangeComplete={onColorChangeComplete}
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
                                    onChange={setImage}
                                    value={{ src: imageSrc }}
                                />
                            </Cell>
                        </Grid>
                        <Select
                            disabled={!imageSrc}
                            label="Scaling"
                            value={get(bg, "image.scaling")}
                            updateValue={setScaling}
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
                                    onChange={setPosition}
                                />
                            </Cell>
                        </Grid>
                    </Tab>
                )}
            </Tabs>
        </React.Fragment>
    );
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(Settings);
