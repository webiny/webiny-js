import { atom } from "recoil";

export interface SidebarAtomType {
    activeTabIndex: number;
    highlightTab: boolean;
}
export const sidebarAtom = atom<SidebarAtomType>({
    key: "sidebarAtom",
    default: {
        activeTabIndex: 0,
        highlightTab: false
    }
});
