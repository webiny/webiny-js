import React from "react";
import Widget from "../../utils/Widget";

class ParagraphWidget extends Widget {
    render(widget) {
        const settings = widget.settings || {};
        return <p style={{ textAlign: settings.align || "left" }}>{widget.data.text}</p>;
    }
}

export default ParagraphWidget;
