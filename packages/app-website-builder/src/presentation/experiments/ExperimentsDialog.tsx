import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { Dialog, Text } from "@webiny/admin-ui";
import { useDialog } from "@webiny/app-admin";
import { useFeature } from "@webiny/app";
import { experimentsDialogParams } from "./experimentsDialogSchema.js";
import { ExperimentsPresentationFeature } from "./feature.js";
import { CreateExperimentForm } from "./components/CreateExperimentForm.js";
import { ExperimentRow } from "./components/ExperimentRow.js";

export const EXPERIMENTS_DIALOG = "websiteBuilderExperiments";

export const ExperimentsDialog = observer(() => {
    const { params, closeDialog } = useDialog(experimentsDialogParams);
    const { presenter } = useFeature(ExperimentsPresentationFeature);

    useEffect(() => {
        presenter.init({
            pageEntryId: params.pageEntryId,
            baselineRevisionId: params.baselineRevisionId,
            pageIsPublished: params.pageIsPublished
        });
    }, [params.pageId]);

    const { vm } = presenter;

    return (
        <Dialog
            open={true}
            onClose={closeDialog}
            title="A/B testing"
            description="Run a whole-page experiment against the live revision of this page."
            actions={<Dialog.CancelAction onClick={closeDialog} text="Close" />}
        >
            {vm.error ? <Text size="sm">{vm.error}</Text> : null}
            {vm.hasRunningExperiment ? (
                <Text size="sm">
                    Publishing a new revision of this page will end the running experiment.
                </Text>
            ) : null}
            <CreateExperimentForm presenter={presenter} />
            {vm.loading ? (
                <Text>Loading experiments…</Text>
            ) : (
                vm.experiments.map(experiment => (
                    <ExperimentRow
                        key={experiment.id}
                        presenter={presenter}
                        experiment={experiment}
                    />
                ))
            )}
        </Dialog>
    );
});
