import { PbEditorElement } from "~/types";
import { useCurrentElement } from "~/editor/hooks/useCurrentElement";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { elementByIdSelector } from "~/editor/recoil/modules";
import { selectorFamily, useRecoilValue } from "recoil";

export interface UseCurrentBlock {
    block: PbEditorElement | null;
}

/**
 * This selector will traverse the "elements" atom, going up the tree, until it finds the root block element.
 */
export const blockByElementSelector = selectorFamily<PbEditorElement | null, string | undefined>({
    key: "blockByElementSelector",
    get: id => {
        return ({ get }) => {
            if (!id) {
                return null;
            }

            let element = get(elementByIdSelector(id));

            if (!element) {
                return null;
            }

            if (element.type === "block") {
                return element;
            }

            while (true) {
                element = get(elementByIdSelector(element.parent || ""));

                if (!element) {
                    return null;
                }

                if (element.type === "block") {
                    return element;
                }
            }
        };
    }
});

/**
 * There are several scenarios that need handling:
 * 1) hook is called from editor content element renderer (any element state).
 * 2) hook is called while one of the elements is active/selected (settings, toolbar, ....).
 * 3) hook is called outside of editor content, and no element is selected -> return null.
 */
export function useCurrentBlockElement(): UseCurrentBlock {
    let currentElementContext;

    // 1) hook is called from within the editor content component.
    try {
        currentElementContext = useCurrentElement();
    } catch {
        // Means we're not in the editor content.
    }

    // 2) hook is called while one of the elements is active/selected (settings, toolbar, ....)
    const [activeElement] = useActiveElement();

    // Elements within the main editor content have higher priority when deciding the relevant element.
    const elementId = currentElementContext?.element?.id || activeElement?.id;

    return { block: useRecoilValue(blockByElementSelector(elementId)) };
}
