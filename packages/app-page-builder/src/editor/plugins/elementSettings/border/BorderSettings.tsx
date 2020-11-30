import React from "react";
import { useRecoilValue } from "recoil";
import { css } from "emotion";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { AccordionItem } from "@webiny/ui/Accordion";
import useUpdateHandlers from "../useUpdateHandlers";
// Icons
import { ReactComponent as BorderIcon } from "../../../assets/icons/border_outer.svg";
// Components
import ColorPicker from "../components/ColorPicker";
import Select from "../components/Select";
import { ContentWrapper } from "../components/StyledComponents";
import BoxInputs from "../components/BoxInputs";

const classes = {
    selectWrapper: css({
        "&.mdc-layout-grid": {
            padding: 0,
            marginBottom: 24
        }
    })
};

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
        <AccordionItem
            icon={<BorderIcon />}
            title={"Border"}
            description={"Align the inner content of an element."}
        >
            <ContentWrapper direction={"column"}>
                <Select
                    className={classes.selectWrapper}
                    label={"Style"}
                    value={border.style || "none"}
                    updateValue={getUpdateValue("style")}
                    options={options}
                />
                <ColorPicker
                    className={classes.selectWrapper}
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
        </AccordionItem>
    );
};
export default React.memo(BorderSettings);
