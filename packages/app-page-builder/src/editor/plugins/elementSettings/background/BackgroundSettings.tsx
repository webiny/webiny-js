import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import { useRecoilValue } from "recoil";
import startCase from "lodash/startCase";
import get from "lodash/get";
import { Tooltip } from "@webiny/ui/Tooltip";
import { plugins } from "@webiny/plugins";
import { Cell, Grid } from "@webiny/ui/Grid";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "../../../../types";
import { activeElementWithChildrenSelector, uiAtom } from "../../../recoil/modules";
import useUpdateHandlers from "../useUpdateHandlers";
// Components
import Wrapper from "../components/Wrapper";
import SelectField from "../components/SelectField";
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";

const positions = [
    "top left",
    "top",
    "top right",
    "center left",
    "center",
    "center right",
    "bottom left",
    "bottom center",
    "bottom right"
];

const imageSelect = css({
    width: "100%"
});

const DATA_NAMESPACE = "data.settings.background";

type SettingsPropsType = {
    options: {
        [key: string]: any;
    };
};
const BackgroundSettings: React.FunctionComponent<SettingsPropsType &
    PbEditorPageElementSettingsRenderComponentProps> = ({ options, defaultAccordionValue }) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const { config: activeDisplayModeConfig } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const setImage = useCallback(value => getUpdateValue(`${displayMode}.image.file`)(value), [
        getUpdateValue,
        displayMode
    ]);
    const setScaling = useCallback(value => getUpdateValue(`${displayMode}.image.scaling`)(value), [
        getUpdateValue,
        displayMode
    ]);
    const setPosition = useCallback(
        value => getUpdateValue(`${displayMode}.image.position`)(value),
        [getUpdateValue]
    );
    const setColor = useCallback(value => getUpdateValue(`${displayMode}.color`)(value), [
        getUpdateValue,
        displayMode
    ]);
    const onColorChange = useCallback(value => getUpdatePreview(`${displayMode}.color`)(value), [
        getUpdatePreview,
        displayMode
    ]);

    const background = get(element, `${DATA_NAMESPACE}.${displayMode}`, {});
    const { color: backgroundColor, image: backgroundImage } = background || {};
    const { scaling: backgroundImageScaling, position: backgroundImagePosition } =
        backgroundImage || {};
    const { src: backgroundImageSrc } = backgroundImage?.file || {};

    return (
        <Accordion
            title={"Background"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <ContentWrapper direction={"column"}>
                <Grid className={classes.simpleGrid}>
                    <Cell span={12}>
                        <ColorPicker
                            label={"Color"}
                            value={backgroundColor}
                            updatePreview={onColorChange}
                            updateValue={setColor}
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
                        <Wrapper label={"Position"} containerClassName={classes.simpleGrid}>
                            <SelectField
                                value={backgroundImagePosition}
                                onChange={setPosition}
                                disabled={!backgroundImageSrc}
                            >
                                {positions.map(position => (
                                    <option key={position} value={position}>
                                        {startCase(position)}
                                    </option>
                                ))}
                            </SelectField>
                        </Wrapper>
                    </React.Fragment>
                )}
            </ContentWrapper>
        </Accordion>
    );
};

export default React.memo(BackgroundSettings);
