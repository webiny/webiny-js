import { PbElement } from "@webiny/app-page-builder/types";
import lodashGet from "lodash/get";
import { selectorFamily } from "recoil";
import { contentSelector } from "../../page/selectors/contentSelector";
import { elementByIdSelector } from "./elementByIdSelector";

export const elementParentWithChildrenByIdSelector = selectorFamily<PbElement, string>({
    key: "elementParentWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const element = get(elementByIdSelector(id));
            const content = get(contentSelector);
            const parentPaths = element.path.split(".").slice(0, -1);
            if (parentPaths.length === 1) {
                return content;
            }

            return lodashGet<PbElement>(content, parentPaths.join(".elements.").slice(2));
        };
    }
});
