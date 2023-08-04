import { useRecoilState, useRecoilValue } from "recoil";
import { elementByIdSelector, elementWithChildrenByIdSelector } from "~/editor/recoil/modules";

export function useElementById(id: string | null) {
    return useRecoilState(elementByIdSelector(id));
}

export function useElementWithChildrenById(id: string | null) {
    return useRecoilValue(elementWithChildrenByIdSelector(id));
}
