import React from "react";
import { activeElementSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { getPlugins } from "@webiny/plugins";
import { PbEditorPageElementAdvancedSettingsPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

const AdvancedAction: React.FunctionComponent<any> = ({ children }) => {
    const element = useRecoilValue(activeElementSelector);
    if (!element) {
        throw new Error(
            "This component should not be called if there is no active element selected."
        );
    }
    const elementType = element.type;
    const plugins = getPlugins<PbEditorPageElementAdvancedSettingsPlugin>(
        "pb-editor-page-element-advanced-settings"
    );

    if (!plugins.some(pl => pl.elementType === elementType)) {
        return null;
    }

    return children;
};

export default React.memo(AdvancedAction);
