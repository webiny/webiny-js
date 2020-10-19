import { contentSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { selector } from "recoil";

export const elementsInContentTotalSelector = selector({
    key: "elementsInContentTotalSelector",
    get: ({ get }) => {
        const content = get(contentSelector);
        return Number(content.elements?.length);
    }
});
