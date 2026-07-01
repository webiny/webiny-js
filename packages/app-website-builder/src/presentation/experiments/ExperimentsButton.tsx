import React, { useEffect } from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { useSelectFromEditor } from "~/BaseEditor/hooks/useSelectFromEditor.js";
import { ExperimentsSwitcher, type ExperimentItem } from "./ExperimentsSwitcher.js";
import { ExperimentIndicator } from "./ExperimentIndicator.js";
import { useExperimentsEditor } from "./ExperimentsEditorContext.js";

/**
 * Top-bar entry point for A/B experiments.
 *
 * On an editable (draft) page it's a switcher for picking an experiment to edit; on a published
 * (read-only) page it's an indicator for the running experiment with a pause/resume kill-switch.
 * State is shared through the editor-wide context so the in-preview toolbar tracks the selection.
 */
export const ExperimentsButton = () => {
    const { experiments, selectedExperimentId, selectExperiment, openManage } =
        useExperimentsEditor();
    const isReadOnly = useSelectFromEditor(state => state.isReadOnly);

    const runningExperiment =
        experiments.find(experiment => experiment.status === "running") ?? null;

    // On the published (read-only) view, surface the running experiment and keep it selected so the
    // preview toolbar tracks it.
    useEffect(() => {
        if (isReadOnly && runningExperiment && selectedExperimentId !== runningExperiment.id) {
            selectExperiment(runningExperiment.id);
        }
    }, [isReadOnly, runningExperiment, selectedExperimentId, selectExperiment]);

    if (isReadOnly) {
        if (!runningExperiment) {
            return null;
        }
        return (
            <div style={{ display: "flex" }}>
                <ExperimentIndicator experiment={runningExperiment} />
            </div>
        );
    }

    const items: ExperimentItem[] = experiments.map(experiment => ({
        id: experiment.id,
        name: experiment.name,
        status: experiment.status === "running" ? "active" : "inactive"
    }));

    return (
        <div style={{ display: "flex" }}>
            {experiments.length === 0 ? (
                <Button
                    variant="secondary"
                    icon={<ScienceIcon />}
                    text="Experiments"
                    onClick={openManage}
                />
            ) : (
                <ExperimentsSwitcher
                    experiments={items}
                    selectedId={selectedExperimentId}
                    onSelect={selectExperiment}
                    onManage={openManage}
                />
            )}
        </div>
    );
};
