import React, { useState } from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/expand_more.svg";
import { ExperimentsDrawer } from "./ExperimentsDrawer.js";
import { ExperimentsSwitcher, type ExperimentItem } from "./ExperimentsSwitcher.js";
import type { NewExperimentPayload } from "./NewExperimentForm.js";

/**
 * Top-bar entry point for A/B experiments.
 *
 * With no experiments on the page it's a simple "Experiments" button that opens the empty-state
 * drawer. Once experiments exist it becomes a switcher (which experiment/variant you're viewing).
 * Experiments are held in local state for now — persistence is a later step.
 */
export const ExperimentsButton = () => {
    const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const handleCreate = (payload: NewExperimentPayload) => {
        const item: ExperimentItem = {
            id: crypto.randomUUID(),
            name: payload.name,
            status: "inactive"
        };
        setExperiments(prev => [...prev, item]);
        setSelectedId(item.id);
        setDrawerOpen(false);
    };

    return (
        <div style={{ display: "flex" }}>
            {experiments.length === 0 ? (
                <Button
                    variant="secondary"
                    icon={<ScienceIcon />}
                    text={
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                            Experiments
                            <ChevronDownIcon style={{ width: 16, height: 16 }} />
                        </span>
                    }
                    onClick={() => setDrawerOpen(true)}
                />
            ) : (
                <ExperimentsSwitcher
                    experiments={experiments}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onManage={() => setDrawerOpen(true)}
                />
            )}
            <ExperimentsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onCreate={handleCreate}
            />
        </div>
    );
};
