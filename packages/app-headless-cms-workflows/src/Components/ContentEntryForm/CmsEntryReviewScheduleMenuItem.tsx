import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

const { Actions } = ContentEntryEditorConfig;
const { MenuItemAction } = Actions;

interface ReviewGatedMenuItemProps {
    children: React.ReactElement;
}

const ReviewGatedMenuItem = createReactiveComponent((props: ReviewGatedMenuItemProps) => {
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { entry, model } = formPresenter.vm;
    const isReviewed = entry !== null && isReviewableModel(model);
    // A published entry offers "Schedule unpublish", which no review blocks.
    const schedulesPublish = entry?.meta.status !== "published";

    if (isReviewed && schedulesPublish && !session.presenter.vm.allowsPublishing) {
        return null;
    }

    return props.children;
});

/*
 * "Schedule publish" needs what publishing needs (the API refuses the schedule with
 * `Workflows/Review/PublishBlocked` otherwise), so it is hidden rather than disabled (R226) unless
 * the review allows publishing; "Schedule unpublish" of a published entry is left alone. There is
 * a possibility that this decorator will not do anything, because the scheduler is not turned on.
 */
export const CmsEntryReviewScheduleMenuItem = MenuItemAction.createDecorator(Original => {
    return function CmsEntryReviewScheduleMenuItemDecorator(props) {
        if (props.name !== "schedule") {
            return <Original {...props} />;
        }

        return (
            <Original
                {...props}
                element={<ReviewGatedMenuItem>{props.element}</ReviewGatedMenuItem>}
            />
        );
    };
});
