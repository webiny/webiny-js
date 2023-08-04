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
        if (el.data?.conditions) {
            el.data.conditions = [];
        }
        if (el.elements && el.elements.length) {
            el = removeElementDynamicSource(el);
        }

        return el;
    });

    return el;
};

export const useUnlinkBlockDynamic = () => {
    const { getElementTree } = useEventActionHandler();
    const updateElement = useUpdateElement();

    const onUnlink = useCallback(
        async (element: MaybeElement): Promise<void> => {
            if (element) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { dynamicSource, ...newData } = element.data;
                const pbElement = (await getElementTree({
                    element: { ...element, data: newData }
                })) as PbElement;
                // we make copy of element to delete dynamicSources from it
                const elementCopy = cloneDeep(pbElement);
                const elementWithoutDynamicSources = removeElementDynamicSource(elementCopy);
                updateElement(elementWithoutDynamicSources);
            }
        },
        [updateElement]
    );

    const onChange = useCallback(
        async (element: MaybeElement, modelId: string): Promise<void> => {
            if (element) {
                const pbElement = (await getElementTree({ element })) as PbElement;
                // we make copy of element to delete dynamicSources from it
                const elementCopy = cloneDeep(pbElement);
                const elementWithoutDynamicSources = removeElementDynamicSource(elementCopy);
                updateElement({
                    ...elementWithoutDynamicSources,
                    data: { ...elementWithoutDynamicSources.data, dynamicSource: { modelId } }
                });
            }
        },
        [updateElement]
    );

    return { onUnlink, onChange };
};
