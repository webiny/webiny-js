// @flow
import * as React from "react";
import { connect } from "react-redux";
import {
    getActiveElementId,
    getElement,
    getElementWithChildren
} from "webiny-app-cms/editor/selectors";

export function withActiveElement({ propName = "element", shallow = false, keys = [] }: Object = {}) {
    return function decorator(Component: React.ComponentType<*>) {
        return connect(state => {
            const elementId = getActiveElementId(state);
            if (!elementId) {
                return { [propName]: null };
            }

            let element = shallow
                ? getElement(state, elementId)
                : getElementWithChildren(state, elementId);

            if (keys.length > 0) {
                return {
                    [propName]: keys.reduce((el, key) => {
                        el[key] = element[key];
                        return el;
                    }, {})
                };
            }

            return { [propName]: element };
        })(Component);
    };
}
