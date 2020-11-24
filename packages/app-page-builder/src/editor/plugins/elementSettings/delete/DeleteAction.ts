import React from "react";
import { useEventActionHandler } from "@webiny/app-page-builder/editor/provider";
import { DeleteElementActionEvent } from "@webiny/app-page-builder/editor/recoil/actions";
import { activeElementWithChildrenSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { plugins } from "@webiny/plugins";
import { PbEditorPageElementPlugin } from "@webiny/app-page-builder/types";
import { useRecoilValue } from "recoil";

type DeleteActionPropsType = {
    children: React.ReactElement;
};
const DeleteAction: React.FunctionComponent<DeleteActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const element = useRecoilValue(activeElementWithChildrenSelector);

    if (!element) {
        return null;
    }

    const onClick = () => {
        eventActionHandler.trigger(
            new DeleteElementActionEvent({
                element
            })
        );
    };

    const plugin = plugins
        .byType<PbEditorPageElementPlugin>("pb-editor-page-element")
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
