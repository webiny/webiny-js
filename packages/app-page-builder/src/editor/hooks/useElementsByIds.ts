import { useRecoilState } from "recoil";
import { elementsByIdsSelector } from "~/editor/recoil/modules";

export function useElementById(id: string | null) {
    return useRecoilState(elementsByIdsSelector(id));
}
