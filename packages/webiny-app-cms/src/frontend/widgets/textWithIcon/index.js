import React from "react";
import { Widget } from "webiny-app-cms";
import TextWithIconWidget from "./Widget";

class TextWithIcon extends Widget {
    render({ widget }) {
        return <TextWithIconWidget data={widget.data} />;
    }
}

export default TextWithIcon;
