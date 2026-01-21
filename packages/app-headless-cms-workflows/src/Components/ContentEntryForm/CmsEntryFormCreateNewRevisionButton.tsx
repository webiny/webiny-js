import React, { useCallback } from "react";
import { useRoute } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { ContentEntryEditorConfig, usePermission } from "@webiny/app-headless-cms";
import { useContentEntryForm } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/useContentEntryForm.js";
import { usePersistEntry } from "@webiny/app-headless-cms/admin/hooks/usePersistEntry.js";
import { ReactComponent as NewReleaseIcon } from "@webiny/icons/new_releases.svg";
import { useWorkflowState } from "@webiny/app-workflows";

const { Actions } = ContentEntryEditorConfig;

const CreateNewRevisionMenuItem = () => {
    const toast = useToast();
    const { setRouteParams } = useRoute();
    const { presenter } = useWorkflowState();
    const { canEdit } = usePermission();
    const { OptionsMenuItem } = Actions.MenuItemAction.useOptionsMenuItem();
    const { entry } = useContentEntryForm();
    const { persistEntry } = usePersistEntry({
        addItemToListCache: true
    });

    const onClick = useCallback(async () => {
        const newRevision = await persistEntry(
            {
                id: entry.id
            },
            {
                skipValidators: ["required"],
                createNewRevision: true
            }
        );

        if (newRevision.error) {
            toast.showWarningToast({
                title: "Could not create a new revision.",
                description: newRevision.error.message
            });
            return;
        }

        setRouteParams(params => {
            return { ...params, id: newRevision.entry.id };
        });
    }, [entry, persistEntry]);

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
