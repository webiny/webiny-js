import { useMemo } from "react";
import { useFeature } from "@webiny/app";
import { useDocumentEditor } from "~/DocumentEditor/index.js";
import { ElementSidebarFeature } from "./feature.js";

/**
 * The sidebar presenter of the open editor. The sidebar is shared by every editor (page, layout, global
 * component), so each gets its own.
 */
export const useElementSidebar = () => {
    const editor = useDocumentEditor();
    const { presenter } = useFeature(ElementSidebarFeature);

    return useMemo(() => {
        presenter.init(editor);
        return presenter;
    }, [presenter, editor]);
};
