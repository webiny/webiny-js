import { extrapolateContentElementHelper } from "@webiny/app-page-builder/editor/helpers";
import { contentSelector } from "@webiny/app-page-builder/editor/recoil/modules";
import { PbElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";

export const elementByPathSelector = selectorFamily<PbElement | undefined, string>({
    key: "elementByPathSelector",
    get: path => {
        return ({ get }) => {
            const content = get(contentSelector);
            return extrapolateContentElementHelper(content, path);
        };
    }
});
