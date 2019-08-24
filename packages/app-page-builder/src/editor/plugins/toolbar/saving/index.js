//@flow
import React from "react";
import Saving from "./Saving";

export default {
    name: "pb-editor-toolbar-save",
    type: "pb-editor-toolbar-bottom",
    renderAction() {
        return <Saving/>;
    }
};
