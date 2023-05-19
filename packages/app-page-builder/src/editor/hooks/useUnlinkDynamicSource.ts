import { useCallback } from "react";
import { cloneDeep } from "lodash";
import { useUpdateElement } from "~/editor/hooks/useUpdateElement";
import { useEventActionHandler } from "~/editor/hooks/useEventActionHandler";
import { PbElement } from "~/types";
import type { MaybeElement } from "~/editor/hooks/useActiveElement";

const removeElementDynamicSource = (el: PbElement): PbElement => {
    el.elements = el.elements.map(el => {
        if (el.data?.dynamicSource) {
            // @ts-ignore
            delete el.data?.dynamicSource;
        }
        if (el.elements && el.elements.length) {
            el = removeElementDynamicSource(el);
        }

        return el;
    });

    return el;
};

export const useUnlinkBlockDynamic = ({ element }: { element: MaybeElement }) => {
    const { getElementTree } = useEventActionHandler();
    const updateElement = useUpdateElement();

    const onUnlink = useCallback(async (): Promise<void> => {
        if (element) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { blockId, variables, ...newData } = element.data;
            const pbElement = (await getElementTree({
                element: { ...element, data: newData }
            })) as PbElement;
            // we make copy of element to delete variableIds from it
            const elementCopy = cloneDeep(pbElement);
            const elementWithoutVariableIds = removeElementDynamicSource(elementCopy);

            updateElement(elementWithoutVariableIds);
        }
    }, [element, updateElement]);

    return { onUnlink };
};
