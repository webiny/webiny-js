import { extrapolateContentElementUtil } from "@webiny/app-page-builder/editor/recoil/utils";
import { PbElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { contentSelector } from "../../page/selectors/contentSelector";
import { elementByIdSelector } from "./elementByIdSelector";

export const elementParentWithChildrenByIdSelector = selectorFamily<PbElement, string>({
    key: "elementParentWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            const content = get(contentSelector);
            const parentPaths = element.path.split(".");
            parentPaths.pop();
            if (parentPaths.length === 1) {
                return content;
            }

            return extrapolateContentElementUtil(content, parentPaths.join("."));
        };
    }
});
