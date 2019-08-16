//@flow
import React from "react";
import { addReducer } from "webiny-app-cms/editor/redux";
import { DEACTIVATE_ELEMENT } from "webiny-app-cms/editor/actions";
import Bar from "./ElementSettingsBar";

addReducer([DEACTIVATE_ELEMENT], "ui.plugins.element-settings", () => null);

export default {
    name: "pb-page-element-settings-settings-bar",
    type: "pb-page-editor-bar",
    shouldRender({ activeElement }: Object) {
        return activeElement;
    },

    render() {
        return <Bar />;
    }
};
