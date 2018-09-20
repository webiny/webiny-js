//@flow
import React from "react";
import { onAction } from "webiny-app/redux";
import { DEACTIVATE_ELEMENT } from "webiny-app-cms/editor/actions";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import Bar from "./Bar";

onAction(DEACTIVATE_ELEMENT, {
    slice: "editor.ui.plugins.element-settings",
    reducer() {
        return null;
    }
});

export default {
    name: "cms-element-settings-settings-bar",
    type: "cms-editor-bar",
    shouldRender({ state }) {
        return getActiveElement(state);
    },

    render() {
        return <Bar />;
    }
};
