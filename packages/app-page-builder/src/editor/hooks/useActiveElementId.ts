import { useRecoilState } from "recoil";
import { activeElementAtom } from "~/editor/recoil/modules";

export function useActiveElementId() {
    return useRecoilState(activeElementAtom);
}
