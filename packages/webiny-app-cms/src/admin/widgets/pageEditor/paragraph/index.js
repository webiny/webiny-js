import React from "react";
import { EditorWidget } from "webiny-app-cms";

import Settings from "./Settings";
import image from "./icon-paragraph.png";

class ParagraphWidget extends EditorWidget {
    renderWidget() {
        return <img src={image} alt={"Text with icon"} width={"100%"} />;
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                <Settings />
            </WidgetSettingsContainer>
        );
    }
}

export default ParagraphWidget;
