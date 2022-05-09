import { SetterOrUpdater, useRecoilState } from "recoil";
import { activeElementAtom, ActiveElementAtomType } from "~/state";
import { useElementById } from "./useElementById";
import { PbEditorElement } from "~/types";

export function useActiveElement(): [
    PbEditorElement | undefined,
    SetterOrUpdater<ActiveElementAtomType>
] {
    const [activeElementId, setActiveElement] = useRecoilState(activeElementAtom);
    const [activeElement] = useElementById(activeElementId);

    return [activeElement, setActiveElement];
}
