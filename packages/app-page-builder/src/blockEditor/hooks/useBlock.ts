import { useRecoilState } from "recoil";
import { blockAtom } from "../state";

export function useBlock() {
    return useRecoilState(blockAtom);
}
