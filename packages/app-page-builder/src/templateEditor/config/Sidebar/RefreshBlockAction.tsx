import React from "react";
import { ReactComponent as RefreshIcon } from "@material-design-icons/svg/round/refresh.svg";
import { TemplateEditorConfig } from "~/templateEditor/editorConfig/TemplateEditorConfig";
import { useBlockReference } from "./useBlockReference";
import { useRefreshBlock } from "~/editor/hooks/useRefreshBlock";

export const RefreshBlockAction = () => {
    const blockReference = useBlockReference();
    const { refreshBlock, loading } = useRefreshBlock();

    if (!blockReference) {
        return null;
    }

    return (
        <TemplateEditorConfig.Sidebar.ElementAction.IconButton
            label={loading ? "Refreshing..." : "Refresh block"}
            icon={<RefreshIcon />}
            onClick={() => refreshBlock(blockReference.block)}
        />
    );
};
