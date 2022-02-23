import { PbEditorElement } from "~/types";
import { selectorFamily } from "recoil";
import { elementsAtom, ElementsAtomType } from "../elementsAtom";

export const elementByIdSelector = selectorFamily<PbEditorElement | null, string | null>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            if (!id) {
                return null;
            }
            return get(elementsAtom(id));
        };
    },
    set:
        id =>
        ({ set }, newValue) => {
            if (!id) {
                return;
            }
            set(elementsAtom(id), (prevState: ElementsAtomType) => ({
                ...prevState,
                ...newValue
            }));
        }
});
