import { useRecoilState } from "recoil";
import { uiAtom } from "~/state";

export function useUI() {
    return useRecoilState(uiAtom);
}
