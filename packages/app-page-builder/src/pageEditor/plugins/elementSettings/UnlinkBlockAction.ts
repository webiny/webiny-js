import React, { useCallback } from "react";
import { cloneDeep } from "lodash";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { removeElementVarRefs } from "~/pageEditor/helpers";
import { PbElement } from "~/types";

interface UnlinkBlockActionPropsType {
    children: React.ReactElement;
}
const UnlinkBlockAction: React.FC<UnlinkBlockActionPropsType> = ({ children }) => {
    const [element] = useActiveElement();
    const { getElementTree } = useEventActionHandler();
    const updateElement = useUpdateElement();

    const onClick = useCallback(async (): Promise<void> => {
        if (element) {
            // we need to drop blockId and variables properties when unlinking, so they are separated from all other element data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { blockId, variables, ...newData } = element.data;
            const pbElement = (await getElementTree({
                element: { ...element, data: newData }
            })) as PbElement;
            // we make copy of element to delete varRefs from it
            const elementCopy = cloneDeep(pbElement);
            const elementWithoutVarRefs = removeElementVarRefs(elementCopy, variables);

            updateElement(elementWithoutVarRefs);
        }
    }, [element, updateElement]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(UnlinkBlockAction);
