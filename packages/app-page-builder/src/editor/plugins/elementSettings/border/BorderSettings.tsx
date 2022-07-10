import React, { useCallback, useMemo } from "react";
import get from "lodash/get";
import set from "lodash/set";
import merge from "lodash/merge";
import { Tooltip } from "@webiny/ui/Tooltip";
import { PbEditorElement, PbEditorPageElementSettingsRenderComponentProps } from "~/types";
import { applyFallbackDisplayMode } from "../elementSettingsUtils";
// Components
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import BoxInputs from "../components/BoxInputs";
import SelectField from "../components/SelectField";
import Wrapper from "../components/Wrapper";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useDisplayMode } from "~/editor/hooks/useDisplayMode";
import { useUpdateHandlers } from "~/editor/hooks/useUpdateHandlers";

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";
const BORDER_SETTINGS_COUNT = 4;

const BorderSettings: React.FC<PbEditorPageElementSettingsRenderComponentProps> = ({
    defaultAccordionValue
}) => {
    const [element] = useActiveElement<PbEditorElement>();
    const { displayMode, config } = useDisplayMode();

    const fallbackValue = useMemo(() => {
        return applyFallbackDisplayMode(displayMode, mode =>
            get(element, `${DATA_NAMESPACE}.${mode}`)
        );
    }, [displayMode]);

    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE,
        postModifyElement: ({ newElement }) => {
            const value = get(newElement, `${DATA_NAMESPACE}.${displayMode}`, {});
            // if only partial settings are there, merge it with fallback value
            if (Object.keys(value).length < BORDER_SETTINGS_COUNT) {
                set(newElement, `${DATA_NAMESPACE}.${displayMode}`, merge(fallbackValue, value));
            }
        }
    });

    const getUpdateValueWithDisplayMode = useCallback(
        (name: string) => (value: string) => getUpdateValue(`${displayMode}.${name}`)(value),
        [getUpdateValue, displayMode]
    );

    const updateColor = useCallback(
        value => getUpdateValue(`${displayMode}.color`)(value),
        [getUpdateValue, displayMode]
    );

    const updateColorPreview = useCallback(
        value => getUpdatePreview(`${displayMode}.color`)(value),
        [getUpdatePreview, displayMode]
    );

    const border = get(element, `${DATA_NAMESPACE}.${displayMode}`, fallbackValue || {});
    const borderStyle = get(border, `style`, "none");

    return (
        <Accordion
            title={"Border"}
            defaultValue={defaultAccordionValue}
            icon={
                <Tooltip content={`Changes will apply for ${config.displayMode}`}>
                    {config.icon}
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
                    getUpdateValue={getUpdateValueWithDisplayMode}
                />
                <BoxInputs
                    label={"Radius"}
                    value={border}
                    valueKey={"radius"}
                    getUpdateValue={getUpdateValueWithDisplayMode}
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
