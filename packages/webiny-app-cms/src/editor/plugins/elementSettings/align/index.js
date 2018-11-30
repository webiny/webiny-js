//@flow
import React from "react";
import Action from "../components/Action";
import AlignAction from "./AlignAction";

export default {
    name: "cms-element-settings-align",
    type: "cms-element-settings",
    renderAction() {
        return (
            <AlignAction>
                <Action plugin={this.name} tooltip={"Align content"} />
            </AlignAction>
        );
    }
};
