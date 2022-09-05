import { useRecoilState } from "recoil";
import { revisionsAtom } from "../state";

export function useRevisions() {
    return useRecoilState(revisionsAtom);
}
