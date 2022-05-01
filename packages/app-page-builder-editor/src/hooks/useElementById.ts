import { useRecoilState } from "recoil";
import { elementByIdSelector } from "~/state";

export function useElementById(id: string | undefined) {
    return useRecoilState(elementByIdSelector(id));
}
