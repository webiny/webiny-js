import React from "react";
import ColorPicker from "../components/ColorPicker";
import Select from "../components/Select";
import Slider from "../components/Slider";
import Selector from "./Selector";
import useUpdateHandlers from "../useUpdateHandlers";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";

const Settings = () => {
    const element = useRecoilValue(activeElementSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });
    const border = element.data.settings?.border || {};
    return (
        <Tabs>
            <Tab label={"Border"}>
                <ColorPicker
                    label={"Color"}
                    valueKey={DATA_NAMESPACE + ".color"}
                    defaultValue={"#fff"}
                    updateValue={getUpdateValue("color")}
                    updatePreview={getUpdatePreview("color")}
                />
                <Slider
                    label={"Width"}
                    value={border.width}
                    updateValue={getUpdateValue("width")}
                    updatePreview={getUpdatePreview("width")}
                    min={0}
                    max={20}
                    step={1}
                />
                <Slider
                    label={"Radius"}
                    value={border.radius}
                    updateValue={getUpdateValue("radius")}
                    updatePreview={getUpdatePreview("radius")}
                    min={0}
                    max={100}
                    step={1}
                />
                <Select
                    label={"Style"}
                    value={border.style || "none"}
                    updateValue={getUpdateValue("style")}
                    options={options}
                />
                <Selector
                    label={"Borders"}
                    value={border.borders || {}}
                    updateValue={getUpdateValue("borders")}
                />
            </Tab>
        </Tabs>
    );
};
export default React.memo(Settings);
