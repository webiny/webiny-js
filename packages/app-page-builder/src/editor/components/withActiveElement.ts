import * as React from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import {
    getActiveElementId,
    getElement,
    getElementWithChildren
} from "@webiny/app-page-builder/editor/selectors";

export function withActiveElement({ propName = "element", shallow = false, keys = [] } = {}) {
    return function decorator(Component: React.ComponentType<any>) {
        return connect<any, any, any>(state => {
            const elementId = getActiveElementId(state);
            if (!elementId) {
                return { [propName]: null };
            }

            const element = shallow
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
