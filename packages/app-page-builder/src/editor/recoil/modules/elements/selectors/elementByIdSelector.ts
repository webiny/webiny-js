import { PbEditorElement } from "~/types";
import { selectorFamily } from "recoil";
import { elementsAtom, ElementsAtomType } from "../elementsAtom";

export const elementByIdSelector = selectorFamily<PbEditorElement | null, string>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            return get(elementsAtom(id));
        };
    },
    set:
        id =>
        ({ set }, newValue) => {
            set(elementsAtom(id), (prevState: ElementsAtomType) => ({
                ...prevState,
                ...newValue
            }));
        }
});
