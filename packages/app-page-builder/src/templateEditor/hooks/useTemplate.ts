import { useRecoilState } from "recoil";
import { templateAtom } from "../state";

export function useTemplate() {
    return useRecoilState(templateAtom);
}
