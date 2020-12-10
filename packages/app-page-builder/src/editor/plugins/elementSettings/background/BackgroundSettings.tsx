import React, { useCallback } from "react";
import { set } from "dot-prop-immutable";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import { Cell, Grid } from "@webiny/ui/Grid";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { useEventActionHandler } from "../../../../editor";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { UpdateElementActionArgsType } from "../../../recoil/actions/updateElement/types";
import { activeElementWithChildrenSelector } from "../../../recoil/modules";
// Components
import Wrapper from "../components/Wrapper";
import SelectField from "../components/SelectField";
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import BackgroundPositionSelector from "./BackgroundPositionSelector";

const imageSelect = css({
    width: "100%"
});

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
        <Accordion title={"Background"}>
            <ContentWrapper direction={"column"}>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <ColorPicker
                            label={"Color"}
                            value={backgroundColor}
                            updatePreview={onColorChange}
                            updateValue={onColorChangeComplete}
                        />
                    </Cell>
                </Grid>
                {options.image !== false && (
                    <React.Fragment>
                        <Wrapper label={"Image"} containerClassName={classes.simpleGrid}>
                            <SingleImageUpload
                                className={imageSelect}
                                onChange={setImage}
                                value={{ src: backgroundImageSrc }}
                            />
                        </Wrapper>
                        <Wrapper label={"Scaling"} containerClassName={classes.simpleGrid}>
                            <SelectField
                                disabled={!backgroundImageSrc}
                                value={backgroundImageScaling}
                                onChange={setScaling}
                            >
                                <option value="cover">Cover</option>
                                <option value="contain">Contain</option>
                                <option value="originalSize">Original size</option>
                                <option value="tile">Tile</option>
                                <option value="tileHorizontally">Tile Horizontally</option>
                                <option value="tileVertically">Tile Vertically</option>
                            </SelectField>
                        </Wrapper>

                        <Grid className={classes.simpleGrid}>
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
        </Accordion>
    );
};

export default React.memo(BackgroundSettings);
