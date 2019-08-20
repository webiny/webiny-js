// @flow
import { connect } from "webiny-app-page-builder/editor/redux";
import { getPlugins } from "webiny-plugins";
import { getActiveElement } from "webiny-app-page-builder/editor/selectors";

const AdvancedAction = ({ elementType, children }: Object) => {
    const plugins = getPlugins("pb-page-element-advanced-settings");

    if (!plugins.some(pl => pl.elementType === elementType)) {
        return null;
    }

    return children;
};

export default connect(state => ({ elementType: getActiveElement(state).type }))(AdvancedAction);
