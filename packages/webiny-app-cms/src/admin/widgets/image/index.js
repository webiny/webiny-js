import React from "react";
import Widget from "./widget";
import Settings from "./settings";

export default {
    type: "image",
    title: "Image",
    icon: ["fas", "image"],
    removeWidget(widget) {
        console.log("removing image", widget);
        return Promise.resolve();
    },
    renderWidget() {
        return <Widget />;
    },
    renderSettings() {
        return <Settings />;
    }
};
