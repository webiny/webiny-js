import React from "react";
import { PageListConfig } from "@webiny/app-website-builder/presentation/pages/PageList/configs/index.js";
import { isReviewSelectable } from "@webiny/app-workflows/review/domain/isReviewSelectable.js";
import { usePage } from "~/hooks/usePage.js";

const { Browser } = PageListConfig;

interface IWrappedElementProps {
    element: React.ReactElement | undefined;
}

const WrappedElement = (props: IWrappedElementProps) => {
    const { page } = usePage();
    const reviewState = page.workflow?.reviewState ?? null;

    if (isReviewSelectable(reviewState)) {
        return props.element ?? null;
    }

    return null;
};

/*
 * Row actions that publish or unpublish a page, which a review blocks: "Change status" and the
 * scheduler's "Schedule" (only present when the scheduler is installed).
 */
const REVIEW_GATED_ACTIONS = ["changeStatus", "page-schedule"];

export const PageListReviewGatedActions = Browser.Page.Action.createDecorator(Original => {
    return function PageListReviewGatedAction(props) {
        if (REVIEW_GATED_ACTIONS.includes(props.name)) {
            return <Original {...props} element={<WrappedElement element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
