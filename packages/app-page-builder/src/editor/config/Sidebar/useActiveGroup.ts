import { useCallback } from "react";
import store from "store";
import { useActiveElement } from "~/editor/hooks/useActiveElement";
import { useElementSidebar } from "~/editor/hooks/useElementSidebar";
import { updateSidebarActiveTabIndexMutation } from "~/editor/recoil/modules";

const LOCAL_STORAGE_KEY = "webiny_pb_editor_active_tab";

export function useActiveGroup() {
    const [element] = useActiveElement();
    const [sidebar, setSidebar] = useElementSidebar();

    const activeGroup = store.get(LOCAL_STORAGE_KEY, sidebar.activeTabIndex) ?? 0;

    const setActiveGroup = useCallback(
        (index: number) => {
            setSidebar(prev => updateSidebarActiveTabIndexMutation(prev, index));
            if (element) {
                store.set(LOCAL_STORAGE_KEY, index);
            }
        },
        [element]
    );

    return {
        activeGroup,
        setActiveGroup
    };
}
