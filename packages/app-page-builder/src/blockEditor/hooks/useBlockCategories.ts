import { useRecoilState } from "recoil";
import { blockCategoriesAtom } from "../state";

export function useBlockCategories() {
    return useRecoilState(blockCategoriesAtom);
}
