import React from "react";
import { observer } from "mobx-react-lite";
import { Alert } from "@webiny/admin-ui";
import { Content } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import { useWorkflowState } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

export const ContentEntryFormWorkflow = Content.createDecorator(Original => {
    return observer(function ContentEntryFormWorkflowDecorator(props) {
        const formPresenter = useContentEntryFormPresenter();
        const { presenter } = useWorkflowState();
        const model = formPresenter.vm.model;

        const isSingleton = model.tags.includes(CMS_MODEL_SINGLETON_TAG);

        if (isSingleton || formPresenter.vm.isNewEntry) {
            return <Original {...props} />;
        }

        return (
            <>
                <div className={"max-w-screen bg-white p-sm"}>
                    <WorkflowStateBar />
                    {presenter.vm.hasState ? (
                        <Alert type="danger" className={"mt-sm"}>
                            Any changes you do on the entry will not be stored!
                        </Alert>
                    ) : null}
                </div>
                <Original {...props} />
            </>
        );
    });
});
