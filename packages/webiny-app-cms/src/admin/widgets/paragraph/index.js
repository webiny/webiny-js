import React from "react";
import Widget from "./widget";
import Settings from "./settings";

export default {
    type: "paragraph",
    title: "Paragraph",
    icon: ["fas", "align-left"],
    renderWidget() {
        return <Widget />;
    },
    renderSettings() {
        return <Settings />;
    }
};
