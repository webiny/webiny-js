import React from "react";
import { EditorWidget } from "webiny-app-cms";

import ParagraphWidgetCmp from "./Widget";
import ParagraphWidgetSettingsCmp from "./Settings";

class ParagraphWidget extends EditorWidget {
    renderWidget({ WidgetContainer }) {
        return (
            <WidgetContainer>
                <ParagraphWidgetCmp />
            </WidgetContainer>
        );
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                <ParagraphWidgetSettingsCmp />
            </WidgetSettingsContainer>
        );
    }
}

export default ParagraphWidget;
