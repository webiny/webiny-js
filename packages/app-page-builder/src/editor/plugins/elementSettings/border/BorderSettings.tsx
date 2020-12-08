import React from "react";
import { useRecoilValue } from "recoil";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import useUpdateHandlers from "../useUpdateHandlers";
// Components
import Accordion from "../components/Accordion";
import ColorPicker from "../components/ColorPicker";
import { ContentWrapper, classes } from "../components/StyledComponents";
import BoxInputs from "../components/BoxInputs";
import SelectField from "../components/SelectField";
import Wrapper from "../components/Wrapper";

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";

const BorderSettings = () => {
    const element = useRecoilValue(activeElementSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });
    const border = element.data.settings?.border || {};

    return (
        <Accordion title={"Border"}>
            <ContentWrapper direction={"column"}>
                <Wrapper label={"Style"} containerClassName={classes.simpleGrid}>
                    <SelectField value={border.style || "none"} onChange={getUpdateValue("style")}>
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
                    valueKey={DATA_NAMESPACE + ".color"}
                    defaultValue={"#fff"}
                    updateValue={getUpdateValue("color")}
                    updatePreview={getUpdatePreview("color")}
                />
                <BoxInputs
                    label={"Width"}
                    value={border}
                    valueKey={"width"}
                    getUpdateValue={getUpdateValue}
                />
                <BoxInputs
                    label={"Radius"}
                    value={border}
                    valueKey={"radius"}
                    getUpdateValue={getUpdateValue}
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
