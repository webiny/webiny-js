//@flow
import React from "react";
import { ReactComponent as CloneIcon } from "webiny-app-cms/editor/assets/icons/round-queue-24px.svg";
import Action from "../components/Action";
import CloneAction from "./CloneAction";

export default {
    name: "cms-element-settings-clone",
    type: "cms-element-settings",
    renderAction() {
        return (
            <CloneAction>
                <Action tooltip={"Clone element"} icon={<CloneIcon />} />
            </CloneAction>
        );
    }
};
