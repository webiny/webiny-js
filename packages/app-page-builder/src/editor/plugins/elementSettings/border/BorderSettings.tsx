import React, { useCallback, useMemo } from "react";
import { useRecoilValue } from "recoil";
import get from "lodash/get";
import { plugins } from "@webiny/plugins";
import { Tooltip } from "@webiny/ui/Tooltip";
import {
    PbEditorPageElementSettingsRenderComponentProps,
    PbEditorResponsiveModePlugin
} from "../../../../types";
import { activeElementSelector, uiAtom } from "../../../recoil/modules";
import useUpdateHandlers from "../useUpdateHandlers";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
// Components
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import BoxInputs from "../components/BoxInputs";
import SelectField from "../components/SelectField";
import Wrapper from "../components/Wrapper";

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";

const BorderSettings: React.FunctionComponent<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const { displayMode } = useRecoilValue(uiAtom);
    const element = useRecoilValue(activeElementSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    const { config: activeDisplayModeConfig } = useMemo(() => {
        return plugins
            .byType<PbEditorResponsiveModePlugin>("pb-editor-responsive-mode")
            .find(pl => pl.config.displayMode === displayMode);
    }, [displayMode]);

    const getUpdateValueWidthDisplayMode = useCallback(
        name => value => getUpdateValue(`${displayMode}.${name}`)(value),
        [getUpdateValue, displayMode]
    );

    const updateColor = useCallback(value => getUpdateValue(`${displayMode}.color`)(value), [
        getUpdateValue,
        displayMode
    ]);

    const updateColorPreview = useCallback(
        value => getUpdatePreview(`${displayMode}.color`)(value),
        [getUpdatePreview, displayMode]
    );

    const fallbackValue = useMemo(
        () =>
            applyFallbackDisplayMode(displayMode, mode =>
                get(element, `${DATA_NAMESPACE}.${mode}`)
            ),
        [displayMode]
    );

    const border = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue || {});
    const borderStyle = get(border, `style`, "none");

    return (
        <Accordion
            title={"Border"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${activeDisplayModeConfig.displayMode}`}>
                    {activeDisplayModeConfig.icon}
                </Tooltip>
            }
        >
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Style"} containerClassName={classes.simpleGrid}>
                    <SelectField
                        value={borderStyle}
                        onChange={getUpdateValue(`${displayMode}.style`)}
                    >
                        {options.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </SelectField>
                </Wrapper>
                <ColorPicker
                    className={classes.simpleGrid}
                    label={"Color"}
                    value={border.color}
                    updateValue={updateColor}
                    updatePreview={updateColorPreview}
                />
                <BoxInputs
                    label={"Width"}
                    value={border}
                    valueKey={"width"}
                    getUpdateValue={getUpdateValueWidthDisplayMode}
                />
                <BoxInputs
                    label={"Radius"}
                    value={border}
                    valueKey={"radius"}
                    getUpdateValue={getUpdateValueWidthDisplayMode}
                    sides={[
                        {
                            label: "Top left",
                            key: "topLeft"
                        },
                        {
                            label: "Top right",
                            key: "topRight"
                        },
                        {
                            label: "Bottom left",
                            key: "bottomLeft"
                        },
                        {
                            label: "Bottom right",
                            key: "bottomRight"
                        }
                    ]}
                />
            </ContentWrapper>
        </Accordion>
    );
};
export default React.memo(BorderSettings);
