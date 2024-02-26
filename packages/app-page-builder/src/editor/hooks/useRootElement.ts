import { useRecoilValue } from "recoil";
import { elementWithChildrenByIdSelector, rootElementAtom } from "~/editor/recoil/modules";
import { PbEditorElement } from "~/types";

export function useRootElement() {
    const rootElementId = useRecoilValue(rootElementAtom);
    return useRecoilValue(elementWithChildrenByIdSelector(rootElementId)) as PbEditorElement;
}
