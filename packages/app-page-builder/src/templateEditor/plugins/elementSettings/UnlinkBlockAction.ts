import React, { useCallback } from "react";
import cloneDeep from "lodash/cloneDeep";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { removeElementVariableIds } from "~/pageEditor/helpers";
import { PbElement } from "~/types";

interface UnlinkBlockActionPropsType {
    children: React.ReactElement;
}
const UnlinkBlockAction = ({ children }: UnlinkBlockActionPropsType) => {
    const [element] = useActiveElement();
    const { getElementTree } = useEventActionHandler();
    const updateElement = useUpdateElement();

    const onClick = useCallback(async (): Promise<void> => {
        if (element) {
            // we need to drop blockId and variables properties when unlinking, so they are separated from all other element data
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { blockId, variables = [], ...newData } = element.data;
            const pbElement = (await getElementTree({
                element: { ...element, data: newData }
            })) as PbElement;
            // we make copy of element to delete variableIds from it
            const elementCopy = cloneDeep(pbElement);
            const elementWithoutVariableIds = removeElementVariableIds(elementCopy, variables);

            updateElement(elementWithoutVariableIds);
        }
    }, [element, updateElement]);

    return React.cloneElement(children, { onClick });
};

export default React.memo(UnlinkBlockAction);
