import { PbEditorElement } from "~/types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";

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
            /**
             * We are positive that element exists so we can set it
             */
            set(elementsAtom(id), prevState => {
                if (!prevState) {
                    return newValue;
                }
                return {
                    ...prevState,
                    ...newValue
                };
            });
        }
});
