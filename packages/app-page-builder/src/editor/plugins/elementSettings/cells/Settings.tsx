import React from "react";
import Slider from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Slider";
import useUpdateHandlers from "@webiny/app-page-builder/editor/plugins/elementSettings/useUpdateHandlers";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

const DATA_NAMESPACE = "data.settings.cells";

export const Settings: React.FunctionComponent = () => {
    const element = useRecoilValue(activeElementSelector);
    const { getUpdateValue, getUpdatePreview } = useUpdateHandlers({
        element,
        dataNamespace: DATA_NAMESPACE
    });
    const value = element?.data?.settings?.cells?.amount || 2;
    return (
        <Tabs>
            <Tab label={"Cells"}>
                <Slider
                    label={"Amount"}
                    value={value}
                    valueKey={DATA_NAMESPACE + ".amount"}
                    defaultValue={2}
                    updateValue={getUpdateValue("amount")}
                    updatePreview={getUpdatePreview("amount")}
                    min={1}
                    max={12}
                    step={1}
                />
            </Tab>
        </Tabs>
    );
};
