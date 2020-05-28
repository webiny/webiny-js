import React from "react";
import { css } from "emotion";
import { useContentModelEditor } from "@webiny/app-headless-cms/admin/components/ContentModelEditor/Context";
import { Elevation } from "@webiny/ui/Elevation";
import { ContentModelForm } from "@webiny/app-headless-cms/admin/components/ContentModelForm";
import { i18n } from "@webiny/app/i18n";
import { CmsEditorContentTab } from "@webiny/app-headless-cms/types";
const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/preview");

const formPreviewWrapper = css({
    padding: 40,
    backgroundColor: "var(--webiny-theme-color-surface, #fff) !important",
    margin: 40,
    boxSizing: "border-box"
});

const style = {
    noFieldsMessage: css({
        textAlign: "center"
    })
};

export const PreviewTab: CmsEditorContentTab = ({ activeTab }) => {
    const { data } = useContentModelEditor();

    const { fields } = data;

    return (
        <Elevation z={1} className={formPreviewWrapper}>
            {fields && fields.length && activeTab ? (
                <ContentModelForm contentModel={data} />
            ) : (
                <div className={style.noFieldsMessage}>
                    {t`Before previewing the form, please add at least one field to the content model.`}
                </div>
            )}
        </Elevation>
    );
};
