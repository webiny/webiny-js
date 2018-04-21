import React from "react";
import Widget from "./Widget";
import Settings from "./Settings";

export default {
    type: "paragraph",
    title: "Paragraph",
    icon: ["fas", "align-left"],
    renderWidget({ EditorWidget }) {
        return (
            <EditorWidget>
                <Widget />
            </EditorWidget>
        );
    },
    renderSettings() {
        return <Settings />;
    }
};
