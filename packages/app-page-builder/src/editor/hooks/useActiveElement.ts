import { useRecoilState } from "recoil";
import { activeElementAtom } from "~/editor/recoil/modules";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";

export function useActiveElement(): PbEditorElement | null {
    const [activeElementId] = useRecoilState(activeElementAtom);
    if (!activeElementId) {
        return null;
    }
    const [activeElement] = useElementById(activeElementId);

    return activeElement;
}
