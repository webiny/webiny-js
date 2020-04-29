import React from "react";
import { css } from "emotion";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Elevation } from "@webiny/ui/Elevation";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";

const formPreviewWrapper = css({
    padding: 40,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
    margin: 40,
    boxSizing: "border-box"
});

export const PreviewTab = () => {
    const { data } = useContentModelEditor();

    return (
        <Elevation z={1} className={formPreviewWrapper}>
            <ContentModelForm contentModel={data} preview/>
        </Elevation>
    );
};
