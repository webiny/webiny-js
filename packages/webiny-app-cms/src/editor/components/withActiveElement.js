import { connect } from "react-redux";
import { getActiveElement } from "webiny-app-cms/editor/selectors";

export function withActiveElement(propName = "element") {
    return function decorator(Component) {
        return connect(state => {
            const element = getActiveElement(state);

            return {
                [propName]: element
            };
        })(Component);
    };
}
