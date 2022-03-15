import { pageAtom } from "../pageAtom";
import { selector } from "recoil";

export const layoutSelector = selector<string | undefined>({
    key: "layoutSelector",
    get: ({ get }) => {
        const page = get(pageAtom);
        if (!page) {
            return undefined;
        }
        return page.settings?.general?.layout;
    }
});
