import { PbEditorElement } from "~/types";
import { selectorFamily } from "recoil";
import { elementsAtom } from "../elementsAtom";
import { elementByIdSelector } from "./elementByIdSelector";

export const elementsByIdsSelector = selectorFamily<PbEditorElement[], string[]>({
    key: "elementsByIdsSelector",
    get: ids => {
        return () => {
            const a = ids.map(id => {
                if (!id) {
                    return null;
                }
                return elementByIdSelector(id);
            });
            return a;
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
