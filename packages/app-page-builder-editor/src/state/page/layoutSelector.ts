import { selector } from "recoil";
import { pageAtom } from "~/state";

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
