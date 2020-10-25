import React from "react";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import Select from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Select";
import Slider from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Slider";
import { useRecoilValue } from "recoil";
import Selector from "./Selector";
import useUpdateHandlers from "../useUpdateHandlers";

const options = ["none", "solid", "dashed", "dotted"];
const DATA_NAMESPACE = "data.settings.border";
const EMPTY_OBJECT = {};

const Settings = () => {
    const element = useRecoilValue(activeElementSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });
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
                    valueKey={DATA_NAMESPACE + ".width"}
                    defaultValue={0}
                    updateValue={getUpdateValue("width")}
                    updatePreview={getUpdatePreview("width")}
                    min={0}
                    max={20}
                    step={1}
                />
                <Slider
                    label={"Radius"}
                    valueKey={DATA_NAMESPACE + ".radius"}
                    defaultValue={0}
                    updateValue={getUpdateValue("radius")}
                    updatePreview={getUpdatePreview("radius")}
                    min={0}
                    max={100}
                    step={1}
                />
                <Select
                    label={"Style"}
                    valueKey={DATA_NAMESPACE + ".style"}
                    defaultValue={"none"}
                    updateValue={getUpdateValue("style")}
                    options={options}
                />
                <Selector
                    label={"Borders"}
                    valueKey={DATA_NAMESPACE + ".borders"}
                    defaultValue={EMPTY_OBJECT}
                    updateValue={getUpdateValue("borders")}
                />
            </Tab>
        </Tabs>
    );
};
export default React.memo(Settings);
