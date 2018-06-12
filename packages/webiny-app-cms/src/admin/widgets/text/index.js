import React from "react";
import EditorWidget from "../../utils/EditorWidget";
import Widget from "./Widget";
import widgetImage from "./text.png";

class ParagraphWidget extends EditorWidget {
    options = {
        title: "Text",
        description: "Text paragraph useful for writing blog posts or any kind of text content.",
        image: widgetImage,
        data: {
            text:
                "Nullam molestie, tortor id rhoncus scelerisque, ex justo tincidunt nisl, non dignissim justo urna ac ex. Etiam a ultrices justo. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Ut aliquet at nulla id laoreet. Fusce tellus diam, suscipit vel interdum ac, consequat vel ex."
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
                {({ styleGroup, presetGroup }) => [
                    presetGroup(),
                    // Register style settings using the built-in HOC
                    styleGroup()
                ]}
            </WidgetSettingsContainer>
        );
    }
}

export default ParagraphWidget;
