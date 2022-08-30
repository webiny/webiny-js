import React, { useCallback } from "react";
import { useEventActionHandler } from "../../../hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "../../../recoil/actions";
import { activeElementAtom, elementByIdSelector } from "../../../recoil/modules";
import { useRecoilValue } from "recoil";

interface UnlinkBlockActionPropsType {
    children: React.ReactElement;
}
const UnlinkBlockAction: React.FC<UnlinkBlockActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));

    if (!element) {
        return null;
    }

    const { blockId, ...newData } = element.data;

    const onClick = useCallback((): void => {
        eventActionHandler.trigger(
            new UpdateElementActionEvent({
                element: {
                    ...element,
                    data: newData
                },
                history: true
            })
        );
    }, [activeElementId]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(UnlinkBlockAction);
