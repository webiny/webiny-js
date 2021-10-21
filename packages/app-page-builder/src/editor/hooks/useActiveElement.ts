import { SetterOrUpdater, useRecoilState } from "recoil";
import { activeElementAtom } from "~/editor/recoil/modules";
import { useElementById } from "./useElementById";
import { PbEditorElement } from "~/types";

export function useActiveElement(): [PbEditorElement, SetterOrUpdater<string>] {
    const [activeElementId, setActiveElement] = useRecoilState(activeElementAtom);
    const [activeElement] = useElementById(activeElementId);

    return [activeElement, setActiveElement];
}
