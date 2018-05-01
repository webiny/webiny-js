import React from "react";
import EditorWidget from "../../../utils/EditorWidget";

import ParagraphWidgetCmp from "./widget";
import ParagraphWidgetSettingsCmp from "./settings";

class ParagraphWidget extends EditorWidget {
    renderWidget({ EditorWidget }) {
        return (
            <EditorWidget>
                <ParagraphWidgetCmp />
            </EditorWidget>
        );
    }

    renderSettings({ EditorWidgetSettings }) {
        return (
            <EditorWidgetSettings>
                <ParagraphWidgetSettingsCmp />
            </EditorWidgetSettings>
        );
    }
}

export default ParagraphWidget;
