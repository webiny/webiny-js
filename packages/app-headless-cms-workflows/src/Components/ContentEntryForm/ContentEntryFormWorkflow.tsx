import React from "react";
import { ContentEntryForm, useContentEntry, useModel } from "@webiny/app-headless-cms";
import type { IWorkflowState } from "@webiny/app-workflows";
import { Components } from "@webiny/app-workflows";
import { Alert, Grid } from "@webiny/admin-ui";
import type { PersistEntry } from "@webiny/app-headless-cms/admin/components/ContentEntryForm/ContentEntryFormProvider.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import { useSingletonContentEntry } from "@webiny/app-headless-cms/admin/views/contentEntries/hooks/useSingletonContentEntry.js";

const {
    ContentReview: { WorkflowStateBar, WorkflowStateOverlay }
} = Components;

/**
 * To override storing of the entry when in workflow state.
 */
// @ts-expect-error
const emptyFunction: PersistEntry = async () => {
    return void 0;
};

interface IStoreAlertProps {
    state: IWorkflowState | undefined;
}

const StoreAlert = ({ state }: IStoreAlertProps) => {
    if (!state) {
        return null;
    }
    return (
        <Alert className={"mb-md"} type="danger">
            Any changes you do on the entry will not be stored!
        </Alert>
    );
};

interface IShouldShowOriginalParams {
    entry: ReturnType<typeof useContentEntry>["entry"];
    model: ReturnType<typeof useContentEntry>["contentModel"];
}
const shouldShowOriginal = (params: IShouldShowOriginalParams): boolean => {
    const { entry, model } = params;
    /**
     * In case of new entry or no model, show original.
     * Also, for singleton models, show original.
     */
    if (!entry?.id || !model?.modelId) {
        return true;
    }
    return model.tags.includes(CMS_MODEL_SINGLETON_TAG);
};

export const ContentEntryFormWorkflow = ContentEntryForm.createDecorator(Original => {
    return function ContentEntryFormWorkflow(props) {
        const { model } = useModel();

        const isSingleEntryModel = model.tags.includes(CMS_MODEL_SINGLETON_TAG);
        /**
         * A really, really dirty way to determine which hook to use.
         * TODO @bruno - to be blamed
         * TODO @pavel - please give idea how to solve it
         */
        const { entry } = isSingleEntryModel ? useSingletonContentEntry() : useContentEntry();

        const showOriginal = shouldShowOriginal({
            entry,
            model
        });

        if (showOriginal) {
            return <Original {...props} />;
        }

        return (
            <Grid>
                <Grid.Column span={12}>
                    <WorkflowStateBar />
                </Grid.Column>
                <Grid.Column span={12}>
                    <WorkflowStateOverlay>
                        {({ state }) => {
                            return (
                                <>
                                    <StoreAlert state={state} />
                                    <Original
                                        {...props}
                                        persistEntry={state ? emptyFunction : props.persistEntry}
                                    />
                                </>
                            );
                        }}
                    </WorkflowStateOverlay>
                </Grid.Column>
            </Grid>
        );
    };
});
