import { useRecoilState } from "recoil";
import { sourceModelAtom } from "../state";

export function useSourceModel() {
    return useRecoilState(sourceModelAtom);
}
