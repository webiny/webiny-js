import { useRecoilState } from "recoil";
import { revisionsAtom } from "~/editor/recoil/modules";

export function useRevisions() {
    return useRecoilState(revisionsAtom);
}
