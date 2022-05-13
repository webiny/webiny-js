import { useRecoilState } from "recoil";
import { sidebarAtom } from "~/state";

export function useElementSidebar() {
    return useRecoilState(sidebarAtom);
}
