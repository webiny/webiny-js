//@flow
import React from "react";
import { addReducer } from "webiny-app-cms/editor/redux";
import { DEACTIVATE_ELEMENT } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import Bar from "./ElementSettingsBar";

addReducer([DEACTIVATE_ELEMENT], "ui.plugins.element-settings", () => null);

export default {
    name: "cms-element-settings-settings-bar",
    type: "cms-editor-bar",
    shouldRender({ state }: Object) {
        return getActiveElement(state);
    },

    render() {
        return <Bar />;
    }
};
