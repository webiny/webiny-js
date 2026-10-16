import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/admin/components/IsModelPublishable.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ReviewTooltip } from "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";
import { ignoreAction } from "../ignoreAction.js";

const { Actions } = InternalContentEntryEditorConfig;

const BlockedActions = createReactiveComponent(() => {
    const { ButtonPrimary, ButtonSecondary } = Actions.ButtonAction.useButtons();
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { canPublish } = usePermission();
    const { entry, model, canSave, canPublish: canPublishNow } = formPresenter.vm;
    const review = session.presenter.vm;

    if (entry === null || !isReviewableModel(model) || review.publishDisabledReason === null) {
        return null;
    }

    const isStatusUnknown = review.status === "loading" || review.status === "failed";
    const showSave = isStatusUnknown && !canSave;
    const isPublishable = entry.meta.status !== "published" && canPublish("cms.contentEntry");
    const showPublish = isPublishable && !canPublishNow;

    if (!showSave && !showPublish) {
        return null;
    }

    return (
        <ReviewTooltip presenter={session.presenter}>
            {describedBy => (
                <span className={"flex items-center gap-sm"}>
                    {showSave && (
                        <ButtonSecondary
                            aria-disabled={true}
                            aria-describedby={describedBy}
                            onAction={ignoreAction}
                        >
                            {"Save"}
                        </ButtonSecondary>
                    )}
                    {showPublish && (
                        <ButtonPrimary
                            aria-disabled={true}
                            aria-describedby={describedBy}
                            onAction={ignoreAction}
                        >
                            {"Publish"}
                        </ButtonPrimary>
                    )}
                </span>
            )}
        </ReviewTooltip>
    );
});

/*
 * The base Save and Publish buttons render nothing when `canSave` or `canPublish` is false. While
 * the review status is unknown, or a review does not allow publishing yet, this shows them
 * `aria-disabled` and focusable (never removed, R226), with the reason from the shared review rules
 * given by `ReviewTooltip` (its render function hands each button the `aria-describedby`, R241).
 * At most two buttons show (Save only while the status is unknown); the base Save & Publish stays
 * hidden because `canPublish` is false.
 */
export const CmsEntryReviewBlockedActions = () => {
    return (
        <InternalContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.ButtonAction
                    after={"publishOnly"}
                    name={"workflowBlockedActions"}
                    element={<BlockedActions />}
                />
            </IsModelPublishable>
        </InternalContentEntryEditorConfig>
    );
};
