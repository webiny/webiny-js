import { selectorFamily, useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

const dynamicParentSelector = selectorFamily<any | null, string | undefined>({
    key: "dynamicParentSelector",
    get: id => {
        return ({ get }) => {
            if (!id) {
                return null;
            }

            let element = get(elementWithChildrenByIdSelector(id));

            if (!element) {
                return null;
            }

            if (element.data.dynamicSource?.modelId) {
                return element;
            }

            while (true) {
                element = get(elementWithChildrenByIdSelector(element.parent || ""));

                if (!element) {
                    return null;
                }

                if (element.data.dynamicSource?.modelId) {
                    return element;
                }
            }
        };
    }
});

export function useDynamicParent(elementId?: string) {
    return useRecoilValue(dynamicParentSelector(elementId));
}
