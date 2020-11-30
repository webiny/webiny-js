import React, { useCallback } from "react";
import { set } from "dot-prop-immutable";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Cell, Grid } from "@webiny/ui/Grid";
import { AccordionItem } from "@webiny/ui/Accordion";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { useEventActionHandler } from "@webiny/app-page-builder/editor";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { UpdateElementActionArgsType } from "@webiny/app-page-builder/editor/recoil/actions/updateElement/types";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
// Icon
import { ReactComponent as InvertColorsIcon } from "@webiny/app-page-builder/editor/assets/icons/invert_colors.svg";
// Components
import { BaseColorPicker } from "../components/ColorPicker";
import { ContentWrapper } from "../components/StyledComponents";
import BackgroundPositionSelector from "./BackgroundPositionSelector";

const imageSelect = css({
    width: "100%"
});

const classes = {
    grid: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

const root = "data.settings.background";

type SettingsPropsType = {
    options: {
        [key: string]: any;
    };
};
const BackgroundSettings: React.FunctionComponent<SettingsPropsType> = ({ options }) => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const handler = useEventActionHandler();
    const updateElement = (args: UpdateElementActionArgsType): void => {
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

    const background = element.data.settings?.background;
    const { color: backgroundColor = "#fff", image: backgroundImage } = background || {};
    const { scaling: backgroundImageScaling, position: backgroundImagePosition } =
        backgroundImage || {};
    const { src: backgroundImageSrc } = backgroundImage?.file || {};

    return (
        <AccordionItem
            icon={<InvertColorsIcon />}
            title={"Background"}
            description={"Edit the background."}
        >
            <ContentWrapper direction={"column"}>
                <Grid className={classes.grid}>
                    <Cell span={12}>
                        <BaseColorPicker
                            value={backgroundColor}
                            updatePreview={onColorChange}
                            updateValue={onColorChangeComplete}
                        />
                    </Cell>
                </Grid>
                {options.image !== false && (
                    <React.Fragment>
                        <Grid className={classes.grid}>
                            <Cell span={12}>
                                <SingleImageUpload
                                    className={imageSelect}
                                    onChange={setImage}
                                    value={{ src: backgroundImageSrc }}
                                />
                            </Cell>
                        </Grid>
                        <Select
                            className={classes.grid}
                            disabled={!backgroundImageSrc}
                            label="Scaling"
                            value={backgroundImageScaling}
                            updateValue={setScaling}
                        >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="originalSize">Original size</option>
                            <option value="tile">Tile</option>
                            <option value="tileHorizontally">Tile Horizontally</option>
                            <option value="tileVertically">Tile Vertically</option>
                        </Select>
                        <Grid className={classes.grid}>
                            <Cell span={12}>
                                <BackgroundPositionSelector
                                    disabled={!backgroundImageSrc}
                                    value={backgroundImagePosition}
                                    onChange={setPosition}
                                />
                            </Cell>
                        </Grid>
                    </React.Fragment>
                )}
            </ContentWrapper>
        </AccordionItem>
    );
};

export default React.memo(BackgroundSettings);
