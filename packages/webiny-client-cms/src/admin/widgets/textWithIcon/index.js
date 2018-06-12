import React from "react";
import EditorWidget from "../../utils/EditorWidget";
import WidgetSettings from "./Settings";
import Widget from "./Widget";
import widgetImage from "./text-with-icon.png";

class TextWidget extends EditorWidget {
    options = {
        title: "Text with icon",
        description:
            "A paragraph with a configurable icon, suitable for visual separation of text content, feature boxes, etc.",
        image: widgetImage,
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut aliquet at nulla id laoreet. Fusce tellus diam, suscipit vel interdum ac, consequat vel ex.",
            iconSize: "3x",
            icon: {
                icon: "star",
                id: "fas-star",
                prefix: "fas"
            }
        }
    };

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
