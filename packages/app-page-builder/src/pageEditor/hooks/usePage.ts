import { useRecoilState } from "recoil";
import { pageAtom } from "../state";

export function usePage() {
    return useRecoilState(pageAtom);
}
