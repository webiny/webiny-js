import React from "react";
import { Button, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ExperimentsEmptyState } from "./ExperimentsEmptyState.js";
import type { ExperimentDto } from "~/features/experiments/index.js";

interface Props {
    experiments: ExperimentDto[];
    onCreate: () => void;
    onEdit: (experiment: ExperimentDto) => void;
}

const StatusBadge = ({ active }: { active: boolean }) => (
    <span
        style={{
            fontSize: 12,
            fontWeight: 500,
            color: active ? "#0f9d58" : "#6b7280",
            background: active ? "#e6f4ea" : "#f2f2f2",
            borderRadius: 6,
            padding: "1px 8px",
            whiteSpace: "nowrap"
        }}
    >
        {active ? "Active" : "Inactive"}
    </span>
);

export const ExperimentsListView = ({ experiments, onCreate, onEdit }: Props) => {
    if (experiments.length === 0) {
        return <ExperimentsEmptyState onCreateExperiment={onCreate} />;
    }

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <Button
                    variant="secondary"
                    icon={<AddIcon />}
                    text="New experiment"
                    onClick={onCreate}
                />
            </div>

            {experiments.map(experiment => {
                const active = experiment.status === "running";
                const variantCount = Object.keys(experiment.trafficSplit?.variants ?? {}).length;
                return (
                    <div
                        key={experiment.id}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            border: "1px solid #eee",
                            borderRadius: 10,
                            padding: 16,
                            marginBottom: 12,
                            gap: 8
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span
                                style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: active ? "#10b981" : "#9ca3af",
                                    flexShrink: 0
                                }}
                            />
                            <div>
                                <div style={{ fontWeight: 600 }}>{experiment.name}</div>
                                <Text size="sm">
                                    Control + {variantCount} variant{variantCount === 1 ? "" : "s"}
                                </Text>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <StatusBadge active={active} />
                            <Button
                                variant="ghost"
                                icon={<EditIcon />}
                                text="Edit"
                                onClick={() => onEdit(experiment)}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
