import { atom } from "recoil";

export type SidebarAtomType = {
    activeTabIndex: number;
    highlightTab: boolean;
};
export const sidebarAtom = atom<SidebarAtomType>({
    key: "v2.sidebarAtom",
    default: {
        activeTabIndex: 0,
        highlightTab: false
    }
});
