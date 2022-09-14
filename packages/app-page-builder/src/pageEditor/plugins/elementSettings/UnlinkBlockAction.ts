import React, { useCallback } from "react";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { UpdateElementActionEvent } from "~/editor/recoil/actions";
import { activeElementAtom, elementByIdSelector } from "~/editor/recoil/modules";
import { useRecoilValue } from "recoil";

interface UnlinkBlockActionPropsType {
    children: React.ReactElement;
}
const UnlinkBlockAction: React.FC<UnlinkBlockActionPropsType> = ({ children }) => {
    const eventActionHandler = useEventActionHandler();
    const activeElementId = useRecoilValue(activeElementAtom);
    const element = useRecoilValue(elementByIdSelector(activeElementId as string));

    const onClick = useCallback((): void => {
        if (element) {
            eventActionHandler.trigger(
                new UpdateElementActionEvent({
                    element: {
                        ...element,
                        data: newData
                    },
                    history: true
                })
            );
        }
    }, [activeElementId]);

    if (!element) {
        return null;
    }

    // we need to drop blockId property wheen unlinking, so it is separated from all other element data
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { blockId, ...newData } = element.data;

    return React.cloneElement(children, { onClick });
};

export default React.memo(UnlinkBlockAction);
