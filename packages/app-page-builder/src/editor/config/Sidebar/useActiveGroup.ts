import { useCallback } from "react";
import { useLocalStorage } from "@webiny/app";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { updateSidebarActiveTabIndexMutation } from "~/editor/recoil/modules";

const LOCAL_STORAGE_KEY = "pb_editor_active_tab";

export function useActiveGroup() {
    const { localStorage } = useLocalStorage();
    const [element] = useActiveElement();
    const [sidebar, setSidebar] = useElementSidebar();

    const activeGroup = localStorage.get<number>(LOCAL_STORAGE_KEY) ?? sidebar.activeTabIndex ?? 0;

    const setActiveGroup = useCallback(
        (index: number) => {
            setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, index));
            if (element) {
                localStorage.set(LOCAL_STORAGE_KEY, index);
            }
        },
        [element]
    );

    return {
        activeGroup,
        setActiveGroup
    };
}
