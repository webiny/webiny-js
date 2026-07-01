import React from "react";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ExperimentsEmptyState } from "./ExperimentsEmptyState.js";
import { ExperimentCard } from "./ExperimentCard.js";
import type { ExperimentDto } from "~/features/experiments/index.js";

interface Props {
    experiments: ExperimentDto[];
    onCreate: () => void;
    onEdit: (experiment: ExperimentDto) => void;
    onActivate: (experiment: ExperimentDto) => void;
    onDeactivate: (experiment: ExperimentDto) => void;
    onDelete: (experiment: ExperimentDto) => void;
}

export const ExperimentsListView = ({
    experiments,
    onCreate,
    onEdit,
    onActivate,
    onDeactivate,
    onDelete
}: Props) => {
    if (experiments.length === 0) {
        return <ExperimentsEmptyState onCreateExperiment={onCreate} />;
    }

    return (
        <div style={{ padding: 24 }}>
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 16,
                    marginBottom: 20
                }}
            >
                <Text size="sm">
                    Only one experiment can be active at a time. Activating one deactivates the
                    currently active experiment.
                </Text>
                <button
                    type="button"
                    onClick={onCreate}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "none",
                        background: "#e2572a",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                        flexShrink: 0
                    }}
                >
                    <AddIcon style={{ width: 18, height: 18 }} />
                    New
                </button>
            </div>

            {experiments.map(experiment => (
                <ExperimentCard
                    key={experiment.id}
                    experiment={experiment}
                    onEdit={onEdit}
                    onActivate={onActivate}
                    onDeactivate={onDeactivate}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
};
