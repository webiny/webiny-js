// @flow
import * as React from "react";
import { connect } from "webiny-app-cms/editor/redux";
import { getPlugins } from "webiny-plugins";
import { getActiveElement } from "webiny-app-cms/editor/selectors";

const AdvancedAction = ({ elementType, children }: Object) => {
    const plugins = getPlugins("cms-element-advanced-settings");

    if (!plugins.some(pl => pl.element === elementType)) {
        return null;
    }

    return children;
};

export default connect(state => ({ elementType: getActiveElement(state).type }))(AdvancedAction);
