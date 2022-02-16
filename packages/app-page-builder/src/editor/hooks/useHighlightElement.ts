import { useRecoilState, SetterOrUpdater } from "recoil";
import { highlightElementAtom } from "~/editor/recoil/modules";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";

export function useHighlightElement(): [PbEditorElement | null, SetterOrUpdater<string>] {
    const [highlightedElementId, setHighlightedElement] = useRecoilState(highlightElementAtom);
    if (!highlightedElementId) {
        return [
            null,
            () => {
                return void 0;
            }
        ];
    }
    const [element] = useElementById(highlightedElementId);

    return [element, setHighlightedElement];
}
