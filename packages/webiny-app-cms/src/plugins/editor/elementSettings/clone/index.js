//@flow
import React from "react";
import { set } from "dot-prop-immutable";
import { dispatch } from "webiny-app/redux";
import { updateElement } from "webiny-app-cms/editor/actions";
import { insertBlock } from "webiny-app-cms/plugins/editor/blockEditing/actions";
import { cloneElement } from "webiny-app-cms/editor/utils";
import { ReactComponent as CloneIcon } from "webiny-app-cms/editor/assets/icons/round-queue-24px.svg";
import Action from "../Action";

const duplicate = (parent, element) => {
    const isBlock = element.type === "block";
    const position = !isBlock
        ? parent.elements.findIndex(el => el.id === element.id) + 1
        : parseInt(element.path) + 1;

    if (!isBlock) {
        const newElement = set(parent, "elements", [
            ...parent.elements.slice(0, position),
            cloneElement(element),
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]);
        return dispatch(updateElement({ element: newElement }));
    }

    dispatch(insertBlock({ block: cloneElement(element), position }));
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
