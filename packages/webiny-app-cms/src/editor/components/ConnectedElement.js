// @flow
import { isEqual } from "lodash";
import { connect } from "react-redux";
import { getElement } from "webiny-app-cms/editor/selectors";

export default connect(
    (state, props) => {
        const element = getElement(state, props.elementId);
        if (props.withChildElements) {
            return {
                element: { ...element, elements: element.elements.map(id => getElement(state, id)) }
            };
        }
        return { element };
    },
    null,
    null,
    { areStatePropsEqual: isEqual }
)(({ children, element }) => {
    if (typeof children === "function") {
        return children(element);
    }
    return children;
});
