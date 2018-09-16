import React from "react";
import { Button, ButtonPreview } from "./Button";

export default {
    name: "button",
    type: "element",
    element: {
        title: "Button",
        group: "Text",
        settings: ["element-advanced", "element-delete"]
    },
    target: ["column", "row"],
    create(options) {
        return { type: "button", elements: [], data: { text: "Click me" }, ...options };
    },
    render(props) {
        return <Button {...props} />;
    },
    preview({ theme }) {
        return <ButtonPreview theme={theme} />;
    }
};