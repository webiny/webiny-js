import { elementsAtom, rootElementAtom } from "../..";
import { selector } from "recoil";
import { PbEditorElement } from "~/types";

export const elementsInContentTotalSelector = selector({
    key: "elementsInContentTotalSelector",
    get: ({ get }): number => {
        const rootElement = get(rootElementAtom);
        return (get(elementsAtom(rootElement)) as PbEditorElement).elements.length;
    }
});
