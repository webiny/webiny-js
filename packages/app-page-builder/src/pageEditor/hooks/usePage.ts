import { useRecoilState } from "recoil";
import { pageAtom } from "~/editor/recoil/modules";

export function usePage() {
    return useRecoilState(pageAtom);
}
