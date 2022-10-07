import React from "react";
import { cloneDeep } from "lodash";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorElement } from "../../../../types";
import { useRecoilValue } from "recoil";
import { CloneElementActionEvent } from "../../../recoil/actions/cloneElement";

const removeVarRef = (element: PbEditorElement) => {
    if (element?.data?.varRef) {
        const elementCopy = cloneDeep(element);
        delete elementCopy.data.varRef;

        return elementCopy;
    } else {
        return element;
    }
};

interface CloneActionPropsType {
    children: React.ReactElement;
}
const CloneAction: React.FC<CloneActionPropsType> = ({ children }) => {
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
                element: removeVarRef(element)
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
