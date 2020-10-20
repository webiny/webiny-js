import { contentSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";

export const elementsInContentTotalSelector = connectedReadSelector({
    key: "elementsInContentTotalSelector",
    get: ({ get }) => {
        const content = get(contentSelector);
        return Number(content.elements?.length);
    }
});
