import React from "react";
import { EditorWidget } from "webiny-app-cms";

import Settings from "./Settings";
import image from "./wysiwyg.png";

class WysiwygWidget extends EditorWidget {
    renderWidget() {
        return <img src={image} alt={"WYSIWYG"} width={"100%"} />;
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                <Settings />
            </WidgetSettingsContainer>
        );
    }
}

export default WysiwygWidget;
