import { elementsAtom, rootElementAtom } from "@webiny/app-page-builder/editor/recoil/modules";
import { selector } from "recoil";
import { PbElement } from "@webiny/app-page-builder/types";

export const elementsInContentTotalSelector = selector({
    key: "elementsInContentTotalSelector",
    get: ({ get }) => {
        const rootElement = get(rootElementAtom);
        return (get(elementsAtom(rootElement)) as PbElement).elements.length;
    }
});
