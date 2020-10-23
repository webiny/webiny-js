import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import React from "react";
import Slider from "@webiny/app-page-builder/editor/plugins/elementSettings/components/Slider";
import { Tab, Tabs } from "@webiny/ui/Tabs";
import { useRecoilValue } from "recoil";

export const Settings: React.FunctionComponent = () => {
    const element = useRecoilValue(activeElementSelector);
    const value = element.settings?.cells?.total || 1;
    return (
        <Tabs>
            <Tab label={"Cells"}>
                <Slider
                    label={"Amount"}
                    value={value}
                    defaultValue={2}
                    updateValue={() => {
                        return void 0;
                    }}
                    updatePreview={() => {
                        return void 0;
                    }}
                    min={1}
                    max={12}
                    step={1}
                />
            </Tab>
        </Tabs>
    );
};
