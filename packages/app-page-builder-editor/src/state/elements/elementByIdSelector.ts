import { selectorFamily } from "recoil";
import { PbEditorElement } from "~/types";
import { elementsAtom } from "~/state";

export const elementByIdSelector = selectorFamily<PbEditorElement | undefined, string | undefined>({
    key: "elementByIdSelector",
    get: id => {
        return ({ get }) => {
            if (!id) {
                return undefined;
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
             * We are positive that element exists, so we can set it
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
