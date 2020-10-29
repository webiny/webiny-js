import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { UpdateElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import {
    activeElementWithChildrenSelector,
    elementParentWithChildrenByIdSelector
} from "@webiny/app-page-builder/editor/recoil/modules";
import React from "react";
import { plugins } from "@webiny/plugins";
import { set } from "dot-prop-immutable";
import { cloneElement } from "@webiny/app-page-builder/editor/utils";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

type CloneActionPropsType = {
    children: React.ReactElement;
};
const CloneAction: React.FunctionComponent<CloneActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);
    const parent = useRecoilValue(elementParentWithChildrenByIdSelector(element.id));

    if (!element || !parent) {
        return null;
    }
    const onClick = () => {
        const position = parent.elements.findIndex(el => el.id === element.id) + 1;

        const newElement = set(parent, "elements", [
            ...parent.elements.slice(0, position),
            cloneElement(element),
            ...(position < parent.elements.length ? parent.elements.slice(position) : [])
        ]);
        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: newElement
            })
        );
    };

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick });
};
export default React.memo(CloneAction);
