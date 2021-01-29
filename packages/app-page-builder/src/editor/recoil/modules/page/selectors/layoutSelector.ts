import { pageAtom } from "../pageAtom";
import { selector } from "recoil";

export const layoutSelector = selector<string | undefined>({
    key: "layoutSelector",
    get: ({ get }) => {
        const page = get(pageAtom);
        return page.settings?.general?.layout;
    }
});
