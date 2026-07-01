import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/expand_more.svg";
import { useSelectFromDocument } from "~/BaseEditor/hooks/useSelectFromDocument.js";
import { ExperimentsDrawer } from "./ExperimentsDrawer.js";
import { ExperimentsSwitcher, type ExperimentItem } from "./ExperimentsSwitcher.js";
import { useExperiments } from "./useExperiments.js";
import type { ExperimentDto } from "~/features/experiments/index.js";

/**
 * Top-bar entry point for A/B experiments.
 *
 * With no experiments on the page it's a plain "Experiments" button opening the drawer; once
 * experiments exist it becomes a switcher. Experiments are loaded from and persisted to the API.
 */
export const ExperimentsButton = () => {
    const pageRevisionId = useSelectFromDocument(document => document.id);
    const pageEntryId = pageRevisionId.split("#")[0];

    const { listExperiments } = useExperiments();
    const [experiments, setExperiments] = useState<ExperimentDto[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const reload = useCallback(async () => {
        const list = await listExperiments(pageEntryId).catch(() => [] as ExperimentDto[]);
        setExperiments(list);
    }, [pageEntryId, listExperiments]);

    useEffect(() => {
        reload();
    }, [reload]);

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
                    experiments={items}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onManage={() => setDrawerOpen(true)}
                />
            )}
            <ExperimentsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                experiments={experiments}
                pageEntryId={pageEntryId}
                baselineRevisionId={pageRevisionId}
                onChanged={reload}
            />
        </div>
    );
};
