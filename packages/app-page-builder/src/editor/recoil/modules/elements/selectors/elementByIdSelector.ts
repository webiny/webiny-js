import { PbEditorElement } from "../../../../../types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";

export const elementByIdSelector = selectorFamily<PbEditorElement, string>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            return get(elementsAtom(id));
        };
    },
    set:
        id =>
        ({ set }, newValue) => {
            set(elementsAtom(id), prevState => ({
                ...prevState,
                ...newValue
            }));
        }
});
