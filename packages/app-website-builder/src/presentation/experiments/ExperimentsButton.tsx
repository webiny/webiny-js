import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ExperimentsSwitcher, type ExperimentItem } from "./ExperimentsSwitcher.js";
import { useExperimentsEditor } from "./ExperimentsEditorContext.js";

/**
 * Top-bar entry point for A/B experiments.
 *
 * With no experiments on the page it's a plain "Experiments" button opening the drawer; once
 * experiments exist it becomes a switcher. State is shared through the editor-wide context so the
 * in-preview toolbar reacts to the same selection.
 */
export const ExperimentsButton = () => {
    const { experiments, selectedExperimentId, selectExperiment, openManage } =
        useExperimentsEditor();

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
