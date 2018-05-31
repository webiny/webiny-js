import React from "react";
import EditorWidget from "./../../../utils/EditorWidget";
import WidgetSettings from "./Settings";
import Widget from "./Widget";
import widgetImage from "./icon-paragraph.png";

class ParagraphWidget extends EditorWidget {
    renderSelector() {
        return <img src={widgetImage} width={"100%"} />;
    }

    renderWidget({ widget, onChange }) {
        return <Widget data={widget.data} onChange={onChange} />;
    }

    renderSettings({ WidgetSettingsContainer }) {
        return (
            <WidgetSettingsContainer>
                {({ widgetProps, settingsGroup, cssGroup }) => [
                    // Register widget settings using the built-in HOC
                    settingsGroup(<WidgetSettings {...widgetProps} />),
                    // Register CSS settings using the built-in HOC
                    cssGroup()
                ]}
            </WidgetSettingsContainer>
        );
    }
}

export default ParagraphWidget;
