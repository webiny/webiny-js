// @flow
import React, { useCallback } from "react";
import { connect } from "@webiny/app-page-builder/editor/redux";
import { getPlugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { redux } from "@webiny/app-page-builder/editor/redux";
import { updateElement } from "@webiny/app-page-builder/editor/actions";
import { getActiveElement } from "@webiny/app-page-builder/editor/selectors";
import { cloneElement } from "@webiny/app-page-builder/editor/utils";
import {
    getElementWithChildren,
    getParentElementWithChildren
} from "@webiny/app-page-builder/editor/selectors";

const CloneAction = ({ element, children, updateElement }: Object) => {
    const duplicate = useCallback(() => {
        const state = redux.store.getState();
        element = getElementWithChildren(state, element.id);
        const parent = getParentElementWithChildren(state, element.id);
        const position = parent.elements.findIndex(el => el.id === element.id) + 1;

        const newElement = set(parent, "elements", [
            ...parent.elements.slice(0, position),
            cloneElement(element),
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]);
        updateElement({ element: newElement });
    }, [element]);

    const plugin = getPlugins("pb-page-element").find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick: duplicate });
};

export default connect(
    state => ({ element: getActiveElement(state) }),
    { updateElement }
)(CloneAction);
