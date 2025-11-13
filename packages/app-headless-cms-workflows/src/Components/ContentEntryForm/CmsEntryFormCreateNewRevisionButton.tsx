import React, { useCallback } from "react";
import { ContentEntryEditorConfig, usePermission } from "@webiny/app-headless-cms";
import { useContentEntryForm } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/useContentEntryForm.js";
import { ReactComponent as ScheduleIcon } from "@webiny/icons/new_releases.svg";
import { useContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/hooks/index.js";

const { Actions } = ContentEntryEditorConfig;

const CreateNewRevisionMenuItem = () => {
    const { canEdit } = usePermission();
    const { OptionsMenuItem } = Actions.MenuItemAction.useOptionsMenuItem();
    const { loading } = useContentEntry();
    const { entry, saveEntry } = useContentEntryForm();

    const onClick = useCallback(() => {
        saveEntry({
            skipValidators: ["required"]
        });
    }, [saveEntry]);

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<ScheduleIcon />}
            label={`Create New Revision`}
            onAction={onClick}
            disabled={!entry?.meta?.status || loading}
            data-testid={"cms.content-form.header.schedule"}
        />
    );
};

export const CmsEntryFormCreateNewRevisionButton = () => {
    return (
        <ContentEntryEditorConfig>
            <Actions.MenuItemAction
                name={"createNewRevision"}
                element={<CreateNewRevisionMenuItem />}
            />
        </ContentEntryEditorConfig>
    );
};
