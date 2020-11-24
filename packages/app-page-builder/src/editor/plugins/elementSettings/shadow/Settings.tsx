import React from "react";
import ColorPicker from "@webiny/app-page-builder/editor/plugins/elementSettings/components/ColorPicker";
import Input from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Input";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tabs, Tab } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

const DATA_NAMESPACE = "data.settings.shadow";

const Settings: React.FunctionComponent = () => {
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });

    return (
        <Tabs>
            <Tab label={"Shadow"}>
                <ColorPicker
                    label={"Color"}
                    valueKey={DATA_NAMESPACE + ".color"}
                    updateValue={getUpdateValue("color")}
                    updatePreview={getUpdatePreview("color")}
                />

                <Input
                    label={"Horizontal offset"}
                    valueKey={DATA_NAMESPACE + ".horizontal"}
                    updateValue={getUpdateValue("horizontal")}
                />

                <Input
                    label={"Vertical offset"}
                    valueKey={DATA_NAMESPACE + ".vertical"}
                    updateValue={getUpdateValue("vertical")}
                />

                <Input
                    label={"Blur"}
                    valueKey={DATA_NAMESPACE + ".blur"}
                    updateValue={getUpdateValue("blur")}
                />

                <Input
                    label={"Spread"}
                    valueKey={DATA_NAMESPACE + ".spread"}
                    updateValue={getUpdateValue("spread")}
                />
            </Tab>
        </Tabs>
    );
};

export default React.memo(Settings);
