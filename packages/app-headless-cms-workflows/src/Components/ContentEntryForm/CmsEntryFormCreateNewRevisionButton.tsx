import React, { useCallback } from "react";
import { ContentEntryEditorConfig, usePermission } from "@webiny/app-headless-cms";
import { useContentEntryForm } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/useContentEntryForm.js";
import { ReactComponent as NewReleaseIcon } from "@webiny/icons/new_releases.svg";
import { useWorkflowState } from "@webiny/app-workflows";
import { usePersistEntry } from "@webiny/app-headless-cms/admin/hooks/usePersistEntry.js";

const { Actions } = ContentEntryEditorConfig;

const CreateNewRevisionMenuItem = () => {
    const { presenter } = useWorkflowState();
    const { canEdit } = usePermission();
    const { OptionsMenuItem } = Actions.MenuItemAction.useOptionsMenuItem();
    const { entry, saveEntry } = useContentEntryForm();
    const { persistEntry } = usePersistEntry({
        addItemToListCache: true
    });

    const onClick = useCallback(() => {
        persistEntry(
            {
                id: entry.id
            },
            {
                skipValidators: ["required"],
                createNewRevision: true
            }
        );
    }, [saveEntry]);

    if (!canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<NewReleaseIcon />}
            label={`Create New Revision`}
            onAction={onClick}
            disabled={!presenter.vm.state}
            data-testid={"cms.content-form.header.createNewRevision"}
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
