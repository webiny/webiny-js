import React, { useCallback } from "react";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { DeleteElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "../../../../types";
import { useRecoilValue } from "recoil";

type DeleteActionPropsType = {
    children: React.ReactElement;
};
const DeleteAction: React.FunctionComponent<DeleteActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId));

    if (!element) {
        return null;
    }

    const onClick = useCallback(() => {
        eventActionHandler.trigger(
            new DeleteElementActionEvent({
                element
            })
        );
    }, [activeElementId]);

    const plugin = plugins
        .byType(PbEditorPageElementPlugin)
        .find(pl => pl.elementType === element.type);

    if (!plugin) {
        return null;
    }

    if (typeof plugin.canDelete === "function") {
        if (!plugin.canDelete({ element })) {
            return null;
        }
    }

    return React.cloneElement(children, { onClick });
};

export default React.memo(DeleteAction);
