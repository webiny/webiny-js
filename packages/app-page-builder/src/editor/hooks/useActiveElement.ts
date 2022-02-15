import { useRecoilState } from "recoil";
import { activeElementAtom } from "~/editor/recoil/modules";
import { useElementById } from "~/editor/hooks/useElementById";
import { PbEditorElement } from "~/types";

export function useActiveElement(): PbEditorElement {
    const [activeElementId] = useRecoilState(activeElementAtom);
    const [activeElement] = useElementById(activeElementId);

    return activeElement;
}
