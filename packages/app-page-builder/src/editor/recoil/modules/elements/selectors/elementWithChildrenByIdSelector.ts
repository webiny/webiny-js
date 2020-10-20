import { selectorFamily } from "recoil";
import { contentSelector } from "../../page/selectors/contentSelector";
import { elementByIdSelector } from "./elementByIdSelector";
import { PbElement } from "@webiny/app-page-builder/types";
import lodashGet from "lodash/get";

export const elementWithChildrenByIdSelector = selectorFamily<PbElement, string>({
    key: "elementWithChildrenByIdSelector",
    get: id => {
        return ({ get }) => {
            const { path } = get(elementByIdSelector(id));
            const content = get(contentSelector);
            const contentPath = path.replace(/\./g, ".elements.").slice(2);
            // TODO find a better way to get the element from content
            const element = lodashGet(content, contentPath);
            if (!element) {
                return undefined;
                // throw new Error(`Element with path "${contentPath}" not found.`);
            }
            return element as PbElement;
        };
    }
});
