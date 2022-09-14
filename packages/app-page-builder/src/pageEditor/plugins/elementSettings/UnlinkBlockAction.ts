import React, { useCallback } from "react";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";

interface UnlinkBlockActionPropsType {
    children: React.ReactElement;
}
const UnlinkBlockAction: React.FC<UnlinkBlockActionPropsType> = ({ children }) => {
    const [element] = useActiveElement();
    const updateElement = useUpdateElement();

    const onClick = useCallback((): void => {
        if (element) {
            // we need to drop blockId property wheen unlinking, so it is separated from all other element data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { blockId, ...newData } = element.data;

            updateElement({
                ...element,
                data: newData
            });
        }
    }, [element, updateElement]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(UnlinkBlockAction);
