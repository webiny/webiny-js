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

export const PageListChangeStatus = Browser.Page.Action.createDecorator(Original => {
    return function PageListChangeStatusAction(props) {
        if (props.name === "changeStatus") {
            return <Original {...props} element={<WrappedElement element={props.element} />} />;
        }
        return <Original {...props} />;
    };
});
