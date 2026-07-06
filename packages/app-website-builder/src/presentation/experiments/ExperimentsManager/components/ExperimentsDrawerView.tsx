import React, { useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { DiContainerProvider, useContainer, useFeature } from "@webiny/app";
import { Drawer, IconButton, Text } from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import { ExperimentFormView } from "../../ExperimentForm/index.js";
import type { ExperimentDto } from "~/features/experiments/index.js";
import { ExperimentsManagerPresenterFeature } from "../feature.js";
import { ExperimentsListView } from "./ExperimentsListView.js";

const ExperimentsDrawerViewInner = observer(function ExperimentsDrawerViewInner() {
    const { presenter } = useFeature(ExperimentsManagerPresenterFeature);
    const { showSnackbar } = useSnackbar();

    useEffect(() => {
        presenter.init();
        return () => presenter.dispose();
    }, [presenter]);

    const { open, view, editInitial } = presenter.vm;

    const { showConfirmation } = useConfirmationDialog({
        title: "Delete experiment",
        loading: "Deleting experiment...",
        message: (
            <Text>
                You are about to permanently delete this experiment and all of its variants. This
                cannot be undone.
            </Text>
        )
    });

    const handleActivate = async (experiment: ExperimentDto) => {
        try {
            await presenter.activateExperiment(experiment);
            showSnackbar(`"${experiment.name}" is now active.`);
        } catch (ex: any) {
            showSnackbar(ex.message || "Could not activate the experiment.");
        }
    };

    const handleDeactivate = async (experiment: ExperimentDto) => {
        try {
            await presenter.deactivateExperiment(experiment);
            showSnackbar(`"${experiment.name}" was deactivated.`);
        } catch (ex: any) {
            showSnackbar(ex.message || "Could not deactivate the experiment.");
        }
    };

    const handleDelete = (experiment: ExperimentDto) =>
        showConfirmation(async () => {
            try {
                await presenter.deleteExperiment(experiment);
                showSnackbar(`"${experiment.name}" was deleted.`);
            } catch (ex: any) {
                showSnackbar(ex.message || "Could not delete the experiment.");
            }
        });

    const flask = <ScienceIcon style={{ width: 20, height: 20 }} />;
    const back = (
        <IconButton
            variant="ghost"
            size="sm"
            icon={<BackIcon style={{ width: 18, height: 18 }} />}
            onClick={() => presenter.showList()}
        />
    );

    let title: React.ReactNode;
    if (view === "create") {
        title = (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {back}
                {flask}
                New experiment
            </span>
        );
    } else if (view === "edit") {
        title = (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {back}
                {flask}
                Edit experiment
            </span>
        );
    } else {
        title = (
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {flask}
                Experiments
            </span>
        );
    }

    return (
        <Drawer
            open={open}
            onClose={() => presenter.close()}
            modal={true}
            width={520}
            title={title}
            headerSeparator={true}
            bodyPadding={false}
            className={"flex flex-col"}
        >
            {view === "list" ? (
                <ExperimentsListView
                    presenter={presenter}
                    onCreate={() => presenter.showCreate()}
                    onEdit={experiment => presenter.startEdit(experiment)}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onDelete={handleDelete}
                />
            ) : null}
            {view === "create" ? (
                <ExperimentFormView
                    onCancel={() => presenter.showList()}
                    onSubmit={payload => presenter.createExperiment(payload)}
                    submitLabel="Create experiment"
                />
            ) : null}
            {view === "edit" && editInitial ? (
                <ExperimentFormView
                    initial={editInitial}
                    allowStructureChange={false}
                    submitLabel="Save changes"
                    onCancel={() => presenter.showList()}
                    onSubmit={payload => presenter.updateExperiment(payload)}
                />
            ) : null}
        </Drawer>
    );
});

export const ExperimentsDrawerView = () => {
    const container = useContainer();

    const scopedContainer = useMemo(() => {
        const child = container.createChildContainer();
        ExperimentsManagerPresenterFeature.register(child);
        return child;
    }, []);

    return (
        <DiContainerProvider container={scopedContainer}>
            <ExperimentsDrawerViewInner />
        </DiContainerProvider>
    );
};
