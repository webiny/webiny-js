import React from "react";
import { i18n } from "@webiny/app/i18n/index.js";
import { useModelEditor } from "~/admin/hooks/index.js";
import { ContentEntryFormPreview } from "../ContentEntryForm/ContentEntryFormPreview.js";
import { Button } from "@webiny/admin-ui";

const t = i18n.ns("app-headless-cms/admin/components/editor/tabs/preview");

interface PreviewTabProps {
    activeTab: boolean;
    onSwitchToEdit?: () => void;
}

const LayoutIllustration = () => (
    <svg width="90" height="72" viewBox="0 0 90 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="90" height="72" rx="4" fill="white" stroke="#DCE0E5" strokeWidth="1" />
        <rect width="90" height="15" rx="4" fill="#F5F6F7" />
        <rect y="11" width="90" height="4" fill="#F5F6F7" />
        <line x1="0" y1="15" x2="90" y2="15" stroke="#DCE0E5" strokeWidth="1" />
        <circle cx="9" cy="7.5" r="2.5" fill="#FA5723" />
        <circle cx="17" cy="7.5" r="2.5" fill="#FA5723" fillOpacity="0.5" />
        <circle cx="25" cy="7.5" r="2.5" fill="#FA5723" fillOpacity="0.25" />
        <rect x="8" y="18" width="23" height="45" rx="1.5" fill="#F0F1F3" />
        <rect x="36" y="18" width="45" height="20" rx="1.5" fill="#F0F1F3" />
        <rect x="36" y="42" width="21" height="21" rx="1.5" fill="#F0F1F3" />
        <rect x="61" y="42" width="20" height="21" rx="1.5" fill="#F0F1F3" />
    </svg>
);

export const PreviewTab = ({ activeTab, onSwitchToEdit }: PreviewTabProps) => {
    const { data } = useModelEditor();

    if (data.fields && data.fields.length && activeTab) {
        return <ContentEntryFormPreview contentModel={data} />;
    }

    return (
        <div className={"flex flex-col gap-md items-center justify-center pb-[216px] size-full"}>
            <LayoutIllustration />
            <div className={"flex flex-col gap-sm items-center text-center w-full"}>
                <p className={"text-lg font-semibold text-neutral-strong"}>
                    {t`Nothing to see here`}
                </p>
                <p className={"text-sm text-neutral-strong max-w-[400px]"}>
                    {t`It looks like no field has been added to this content model yet. Switch to editor mode to add your first field.`}
                </p>
            </div>
            {onSwitchToEdit && (
                <Button variant={"primary"} size={"sm"} onClick={onSwitchToEdit}>
                    {t`Switch to edit mode`}
                </Button>
            )}
        </div>
    );
};
