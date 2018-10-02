//@flow
import React from "react";
import Saving from "./Saving";

export default {
    name: "cms-toolbar-save",
    type: "cms-toolbar-bottom",
    renderAction() {
        return <Saving/>;
    }
};
