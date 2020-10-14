import { selector } from "recoil";
import { uiAtom } from "../uiAtom";

export const activeElementIdSelector = selector<string | undefined>({
    key: "activeElementIdSelector",
    get: ({ get }) => {
        const { activeElement } = get(uiAtom);
        return activeElement;
    }
});
