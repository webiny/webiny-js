import { useRecoilState } from "recoil";
import { activeElementAtom } from "~/state";

export function useActiveElementId() {
    return useRecoilState(activeElementAtom);
}
