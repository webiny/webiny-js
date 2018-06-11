import React from "react";
import { EditorWidget } from "webiny-app-cms";
import WidgetSettings from "./Settings";
import Widget from "./Widget";
import widgetImage from "./text-with-icon.png";

class TextWidget extends EditorWidget {
    renderSelector() {
        return <img src={widgetImage} width={"100%"} />;
    }

    renderWidget({ WidgetContainer }) {
        return (
            <WidgetContainer>{({ widgetProps }) => <Widget {...widgetProps} />}</WidgetContainer>
        );
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                {({ widgetProps, settingsGroup, styleGroup, presetGroup }) => [
                    // Register widget settings using the built-in HOC
                    presetGroup(),
                    settingsGroup(<WidgetSettings {...widgetProps} />),
                    // Register style settings using the built-in HOC
                    styleGroup()
                ]}
            </WidgetSettingsContainer>
        );
    }
}

export default TextWidget;
