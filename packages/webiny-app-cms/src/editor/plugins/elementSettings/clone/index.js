//@flow
import React from "react";
import { set } from "dot-prop-immutable";
import { dispatch } from "webiny-app-cms/editor/redux";
import { updateElement } from "webiny-app-cms/editor/actions";
import { cloneElement } from "webiny-app-cms/editor/utils";
import { ReactComponent as CloneIcon } from "webiny-app-cms/editor/assets/icons/round-queue-24px.svg";
import Action from "../Action";

const duplicate = (parent, element) => {
    const position = parent.elements.findIndex(el => el.id === element.id) + 1;

    const newElement = set(parent, "elements", [
        ...parent.elements.slice(0, position),
        cloneElement(element),
        ...(position < parent.elements.length ? parent.elements.slice(position) : [])
    ]);
    return dispatch(updateElement({ element: newElement }));
};

export default {
    name: "cms-element-settings-clone",
    type: "cms-element-settings",
    renderAction({ parent, element }: Object) {
        return (
            <Action
                tooltip={"Clone element"}
                onClick={() => duplicate(parent, element)}
                icon={<CloneIcon />}
            />
        );
    }
};
