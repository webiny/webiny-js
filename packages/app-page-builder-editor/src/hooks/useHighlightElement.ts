import { useRecoilState, SetterOrUpdater } from "recoil";
import { highlightElementAtom, HighlightElementAtomType } from "~/state";
import { useElementById } from "~/hooks/useElementById";
import { PbEditorElement } from "~/types";

export function useHighlightElement(): [
    PbEditorElement | undefined,
    SetterOrUpdater<HighlightElementAtomType>
] {
    const [highlightedElementId, setHighlightedElement] = useRecoilState(highlightElementAtom);
    const [element] = useElementById(highlightedElementId);

    return [element, setHighlightedElement];
}
