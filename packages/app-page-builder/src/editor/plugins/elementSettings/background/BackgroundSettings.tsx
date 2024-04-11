import React, { useCallback, useMemo } from "react";
import { css } from "emotion";
import startCase from "lodash/startCase";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Tooltip } from "@webiny/ui/Tooltip";
import { plugins } from "@webiny/plugins";
import { Cell, Grid } from "@webiny/ui/Grid";
import SingleImageUpload from "@webiny/app-admin/components/SingleImageUpload";
import { FileManagerFileItem } from "@webiny/app-admin";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "~/types";
import useUpdateHandlers from "../useUpdateHandlers";
// Components
import Wrapper from "../components/Wrapper";
import SelectField from "../components/SelectField";
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { useActiveElement } from "~/editor/hooks/useActiveElement";

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
const BACKGROUND_SETTINGS_COUNT = 2;

interface SettingsPropsType extends PbEditorPageElementSettingsRenderComponentProps {
    options: {
        image?: boolean;
        [key: string]: any;
    };
}
const BackgroundSettings = ({ options, defaultAccordionValue }: SettingsPropsType) => {
    const { displayMode } = useDisplayMode();
    const [element] = useActiveElement();

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        // We know active element must exist for settings to be rendered, so using `!` is ok here.
        element: element!,
        dataNamespace: DATA_NAMESPACE,
        postModifyElement: ({ newElement }) => {
            const value = get(newElement, `${DATA_NAMESPACE}.${displayMode}`, {});
            // if only partial settings are there, merge it with fallback value
            if (Object.keys(value).length < BACKGROUND_SETTINGS_COUNT) {
                set(newElement, `${DATA_NAMESPACE}.${displayMode}`, merge(fallbackValue, value));
            }
        }
    });

    const memoizedResponsiveModePlugin = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const { config: activeDisplayModeConfig } = memoizedResponsiveModePlugin || {
        config: {
            displayMode: null,
            icon: null
        }
    };

    const setImage = useCallback(
        (value: FileManagerFileItem | null) => getUpdateValue(`${displayMode}.image.file`)(value),
        [getUpdateValue, displayMode]
    );
    const setScaling = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.image.scaling`)(value),
        [getUpdateValue, displayMode]
    );
    const setPosition = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.image.position`)(value),
        [getUpdateValue, displayMode]
    );
    const setColor = useCallback(
        (value: string) => getUpdateValue(`${displayMode}.color`)(value),
        [getUpdateValue, displayMode]
    );
    const onColorChange = useCallback(
        (value: string) => getUpdatePreview(`${displayMode}.color`)(value),
        [getUpdatePreview, displayMode]
    );

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode, element]
    );

    const background = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue || {});
    const { color: backgroundColor, image: backgroundImage } = background;
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
