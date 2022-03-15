import { useRecoilState } from "recoil";
import { elementByIdSelector } from "~/editor/recoil/modules";

export function useElementById(id: string | null) {
    return useRecoilState(elementByIdSelector(id));
}
