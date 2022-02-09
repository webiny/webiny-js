import { useRecoilState } from "recoil";
import { uiAtom } from "~/editor/recoil/modules";

export function useUI() {
    return useRecoilState(uiAtom);
}
