import React from "react";
import { useMemo } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { EditorReviewBar } from "@webiny/app-workflows/review/editor/components/EditorReviewBar.js";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { Routes } from "~/routes.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";
import { getModelFieldLabels } from "./getModelFieldLabels.js";

export const CmsEntryReviewBar = ContentEntryFormContent.createDecorator(Original => {
    return createReactiveComponent(function CmsEntryReviewBarDecorator(props) {
        const formPresenter = useContentEntryFormPresenter();
        const session = useCmsEntryReview();
        const { entry, model } = formPresenter.vm;
        const hasEntry = entry !== null && isReviewableModel(model);
        const showsBar = hasEntry && session.presenter.vm.status !== "noWorkflow";
        const fieldLabels = useMemo(() => getModelFieldLabels(model), [model]);

        if (!showsBar) {
            return <Original {...props} />;
        }

        return (
            <>
                <div
                    className={
                        "max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"
                    }
                >
                    <EditorReviewBar
                        session={session}
                        reviewsRoute={Routes.ContentEntries.ContentReviews}
                        fieldLabels={fieldLabels}
                    />
                </div>
                <Original {...props} />
            </>
        );
    });
});
