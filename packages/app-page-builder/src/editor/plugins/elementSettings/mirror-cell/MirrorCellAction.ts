import React from "react";
import { useRecoilValue } from "recoil";
import { plugins } from "@webiny/plugins";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { activeElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import { MirrorCellActionEvent } from "~/editor/recoil/actions/mirrorCell";
import { PbEditorPageElementPlugin } from "~/types";

interface MirrorCellActionPropsType {
    children: React.ReactElement;
}
const MirrorCellAction = ({ children }: MirrorCellActionPropsType) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));

    if (!element) {
        return null;
    }

    const onClick = () => {
        eventActionHandler.trigger(
            new MirrorCellActionEvent({
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

    return React.cloneElement(children, { onClick });
};

export default React.memo(MirrorCellAction);
