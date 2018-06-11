import React from "react";
import { Widget } from "webiny-app-cms";
import TextWithIconWidget from "./Widget";

class TextWithIcon extends Widget {
    render({ WidgetContainer }) {
        return (
            <WidgetContainer>
                {({ widgetProps }) => <TextWithIconWidget {...widgetProps} />}
            </WidgetContainer>
        );
    }
}

export default TextWithIcon;
