import { connectedAtom } from "../connected";

export type SidebarAtomType = {
    activeTabIndex: number;
    highlightTab: boolean;
};
export const sidebarAtom = connectedAtom<SidebarAtomType>({
    key: "sidebarAtom",
    default: {
        activeTabIndex: 0,
        highlightTab: false
    }
});
