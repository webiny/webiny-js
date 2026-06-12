import React from "react";
import { observer } from "mobx-react-lite";
import { Alert, Grid } from "@webiny/admin-ui";
import { Content } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/views/ContentEntryFormPresenterProvider.js";
import { useWorkflowState } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";

const {
    ContentReview: { WorkflowStateBar }
} = Components;

const StoreAlert = observer(() => {
    const { presenter } = useWorkflowState();
    if (!presenter.vm.state) {
        return null;
    }
    return (
        <Alert className={"mb-md"} type="danger">
            Any changes you do on the entry will not be stored!
        </Alert>
    );
});

export const ContentEntryFormWorkflow = Content.createDecorator(Original => {
    return observer(function ContentEntryFormWorkflowDecorator(props) {
        const formPresenter = useContentEntryFormPresenter();
        const model = formPresenter.vm.model;
        const entry = formPresenter.vm.entry;

        const isSingleton = model.tags.includes(CMS_MODEL_SINGLETON_TAG);
        const isNew = !entry?.id;

        if (isSingleton || isNew) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <WorkflowStateBar />
                </Grid.Column>
                <Grid.Column span={12}>
                    <StoreAlert />
                    <Original {...props} />
                </Grid.Column>
            </Grid>
        );
    });
});
