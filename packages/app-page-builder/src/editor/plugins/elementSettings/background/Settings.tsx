import React, { useCallback } from "react";
import BackgroundPositionSelector from "./BackgroundPositionSelector";
import ColorPicker from "@webiny/app-page-builder/editor/components/ColorPicker";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/updateElement/types";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { set } from "dot-prop-immutable";
import { css } from "emotion";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { Cell, Grid } from "@webiny/ui/Grid";
import { useRecoilValue } from "recoil";

const imageSelect = css({
    width: "100%"
});

const root = "data.settings.background";

type SettingsPropsType = {
    options: {
        [key: string]: any;
    };
};
const Settings: React.FunctionComponent<SettingsPropsType> = ({ options }) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const handler = useEventActionHandler();
    const updateElement = (args: UpdateElementActionArgsType) => {
        handler.trigger(new UpdateElementActionEvent(args));
    };
    const setImage = image => {
        if (!image) {
            updateElement({
                element: set(element, `${root}.image.file`, null),
                history: true
            });
            return;
        }
        updateElement({
            element: set(element, `${root}.image.file`, image),
            history: true
        });
    };
    const setScaling = (value: string) => {
        updateElement({
            element: set(element, `${root}.image.scaling`, value),
            history: true
        });
    };
    const setPosition = (position: string) => {
        updateElement({
            element: set(element, `${root}.image.position`, position),
            history: true
        });
    };
    const setColor = (value: string, history = false) => {
        updateElement({
            element: set(element, `${root}.color`, value),
            history
        });
    };

    const onColorChange = useCallback(value => setColor(value, false), []);
    const onColorChangeComplete = useCallback(value => setColor(value), []);

    const { background: bg } = element.data.settings || {};
    const { src: imageSrc, color: bgColor = "#fff" } = bg.image?.file || {};
    const { scaling: imageScaling, position: imagePosition } = bg.image || {};

    return (
        <Tabs>
            <Tab label={"Color"}>
                <Grid>
                    <Cell span={12}>
                        <ColorPicker
                            value={bgColor}
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
                        value={imageScaling}
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
                                value={imagePosition}
                                onChange={setPosition}
                            />
                        </Cell>
                    </Grid>
                </Tab>
            )}
        </Tabs>
    );
};

export default React.memo(Settings);
