import { connect } from "react-redux";
import {
    getActiveElementId,
    getElement,
    getElementWithChildren
} from "webiny-app-cms/editor/selectors";

export function withActiveElement({ propName = "element", shallow = false } = {}) {
    return function decorator(Component) {
        return connect(state => {
            const elementId = getActiveElementId(state);
            if (!elementId) {
                return { [propName]: null };
            }

            return {
                [propName]: shallow ? getElement(state, elementId) : getElementWithChildren(state, elementId)
            };
        })(Component);
    };
}
