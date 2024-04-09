import React from "react";
import cloneDeep from "lodash/cloneDeep";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorElement } from "../../../../types";
import { useRecoilValue } from "recoil";
import { CloneElementActionEvent } from "../../../recoil/actions/cloneElement";

const removeVariableId = (element: PbEditorElement) => {
    if (element?.data?.variableId) {
        const elementCopy = cloneDeep(element);
        delete elementCopy.data.variableId;

        return elementCopy;
    }
    return element;
};

interface CloneActionPropsType {
    children: React.ReactElement;
}
const CloneAction = ({ children }: CloneActionPropsType) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element: PbEditorElement = useRecoilValue(
        elementByIdSelector(activeElementId as string)
    ) as PbEditorElement;

    if (!element) {
        return null;
    }

    const onClick = () => {
        eventActionHandler.trigger(
            new CloneElementActionEvent({
                element: removeVariableId(element)
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
