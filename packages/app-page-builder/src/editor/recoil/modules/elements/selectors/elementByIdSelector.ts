import { PbElement } from "@webiny/app-page-builder/types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";

export const elementByIdSelector = selectorFamily<PbElement, string>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            return get(elementsAtom(id));
        };
    }
});
