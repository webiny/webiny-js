//@flow
import React from "react";
import { set } from "dot-prop-immutable";
import { redux } from "webiny-app-cms/editor/redux";
import { updateElement } from "webiny-app-cms/editor/actions";
import { cloneElement } from "webiny-app-cms/editor/utils";
import {
    getElementWithChildren,
    getParentElementWithChildren
} from "webiny-app-cms/editor/selectors";
import { ReactComponent as CloneIcon } from "webiny-app-cms/editor/assets/icons/round-queue-24px.svg";
import Action from "../Action";

const duplicate = element => {
    const state = redux.store.getState();
    element = getElementWithChildren(state, element.id);
    const parent = getParentElementWithChildren(state, element.id);
    const position = parent.elements.findIndex(el => el.id === element.id) + 1;

    const newElement = set(parent, "elements", [
        ...parent.elements.slice(0, position),
        cloneElement(element),
        ...(position < parent.elements.length ? parent.elements.slice(position) : [])
    ]);
    return redux.store.dispatch(updateElement({ element: newElement }));
};

export default {
    name: "cms-element-settings-clone",
    type: "cms-element-settings",
    renderAction({ element }: Object) {
        return (
            <Action
                tooltip={"Clone element"}
                onClick={() => duplicate(element)}
                icon={<CloneIcon />}
            />
        );
    }
};
