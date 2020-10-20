import { connectedReadSelector } from "@webiny/app-page-builder/editor/recoil/modules/connected";
import { pageAtom } from "../pageAtom";

export const layoutSelector = connectedReadSelector<string | undefined>({
    key: "layoutSelector",
    get: ({ get }) => {
        const page = get(pageAtom);
        return page.settings?.general?.layout;
    }
});
