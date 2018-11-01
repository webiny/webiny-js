// @flow
import { connect } from "react-redux";
import { getActiveElement } from "webiny-app-cms/editor/selectors";
import _omit from "lodash/omit";

export function withActiveElement({ propName = "element", omit = [] } = {}) {
    return function decorator(Component) {
        return connect(state => {
            const element = _omit(getActiveElement(state), omit);

            return {
                [propName]: element
            };
        })(Component);
    };
}
