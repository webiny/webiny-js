import React from "react";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin, PbEditorElement } from "../../../../types";
import { useRecoilValue } from "recoil";
import { CloneElementActionEvent } from "../../../recoil/actions/cloneElement";

type CloneActionPropsType = {
    children: React.ReactElement;
};
const CloneAction: React.FunctionComponent<CloneActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element: PbEditorElement = useRecoilValue(elementByIdSelector(activeElementId));

    if (!element) {
        return null;
    }
    const onClick = () => {
        eventActionHandler.trigger(
            new CloneElementActionEvent({
                element
            })
        );
    };

    const plugin = plugins
        .byType(PbEditorPageElementPlugin)
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    return React.cloneElement(children, { onClick });
};
export default React.memo(CloneAction);
