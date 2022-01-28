import { useRecoilState } from "recoil";
import { sidebarAtom } from "~/editor/recoil/modules";

export function useElementSidebar() {
    return useRecoilState(sidebarAtom);
}
