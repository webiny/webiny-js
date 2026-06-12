import React, { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useRoute } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { ContentEntryEditorConfig, usePermission } from "@webiny/app-headless-cms";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import { RevisionsListFeature } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/feature.js";
import { ReactComponent as NewReleaseIcon } from "@webiny/icons/new_releases.svg";
import { IsModelPublishable } from "@webiny/app-headless-cms/exports/admin/cms.js";
import { OptionsMenuItem } from "@webiny/app-admin";

const { Actions } = ContentEntryEditorConfig;

const CreateNewRevisionMenuItem = () => {
    const toast = useToast();
    const { setRouteParams } = useRoute();
    const { canEdit } = usePermission();
    const formPresenter = useContentEntryFormPresenter();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);

    const entry = formPresenter.vm.entry;

    const onClick = useCallback(async () => {
        if (!entry) {
            return;
        }

        const newEntry = await revisionsPresenter.createRevision(entry.id);

        if (!newEntry) {
            toast.showWarningToast({
                title: "Could not create a new revision."
            });
            return;
        }

        setRouteParams(params => {
            return { ...params, id: newEntry.id };
        });
    }, [entry, revisionsPresenter]);

    if (!entry || !canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<NewReleaseIcon />}
            disabled={!entry.id}
            label={`Create New Revision`}
            onAction={onClick}
            data-testid={"cms.content-form.header.createNewRevision"}
        />
    );
};

export const CmsEntryFormCreateNewRevisionButton = () => {
    return (
        <ContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.MenuItemAction
                    name={"createNewRevision"}
                    element={<CreateNewRevisionMenuItem />}
                />
            </IsModelPublishable>
        </ContentEntryEditorConfig>
    );
};
