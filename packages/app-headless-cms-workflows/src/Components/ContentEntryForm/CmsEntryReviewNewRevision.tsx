import React, { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useRoute } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/admin/components/IsModelPublishable.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/feature.js";
import { ReactComponent as NewReleaseIcon } from "@webiny/icons/new_releases.svg";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

const { Actions } = InternalContentEntryEditorConfig;

const CreateNewRevisionMenuItem = createReactiveComponent(() => {
    const toast = useToast();
    const { setRouteParams } = useRoute();
    const { canEdit } = usePermission();
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);

    const { entry, model } = formPresenter.vm;
    const status = session.presenter.vm.status;
    const isStatusUnknown = status === "loading" || status === "failed";
    const isBlocked = isReviewableModel(model) && isStatusUnknown;

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
    }, [entry, revisionsPresenter, toast, setRouteParams]);

    if (!entry || !canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<NewReleaseIcon />}
            disabled={!entry.id || isBlocked}
            label={`Create New Revision`}
            onAction={onClick}
            data-testid={"cms.content-form.header.createNewRevision"}
        />
    );
});

/*
 * The base "New Revision" button needs `canCreateNewRevision`, which the review rules turn off for
 * rejected, approved and in-review revisions. This menu item does not depend on it, so a new
 * revision can always be started once the review status is known (for a rejected revision this is
 * the way, and the bar's lock text names it).
 */
export const CmsEntryReviewNewRevision = () => {
    return (
        <InternalContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.MenuItemAction
                    name={"createNewRevision"}
                    element={<CreateNewRevisionMenuItem />}
                />
            </IsModelPublishable>
        </InternalContentEntryEditorConfig>
    );
};
