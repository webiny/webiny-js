import { selector } from "recoil";
import { elementsAtom, rootElementAtom } from "~/state";

export const elementsInContentTotalSelector = selector({
    key: "elementsInContentTotalSelector",
    get: ({ get }): number => {
        const rootElement = get(rootElementAtom);
        if (!rootElement) {
            return 0;
        }
        const editorElement = get(elementsAtom(rootElement));
        if (!editorElement || !editorElement.elements) {
            return 0;
        }
        return editorElement.elements.length;
    }
});
