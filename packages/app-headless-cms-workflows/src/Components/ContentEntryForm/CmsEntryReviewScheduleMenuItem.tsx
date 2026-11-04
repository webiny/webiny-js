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

    if (isReviewed && !session.presenter.vm.allowsPublishing) {
        return null;
    }

    return props.children;
});

/*
 * There is a possibility that this decorator will not do anything, because the scheduler is not
 * turned on.
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
