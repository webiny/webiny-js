import { useRecoilValue } from "recoil";
import { blockByElementSelector } from "~/editor/hooks/useCurrentBlockElement";

export function useParentBlock(elementId?: string) {
    return useRecoilValue(blockByElementSelector(elementId));
}
