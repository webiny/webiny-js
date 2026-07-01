import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useExperiments } from "./useExperiments.js";
import { ExperimentsDrawer } from "./ExperimentsDrawer.js";
import type { ExperimentDto, VariantDto } from "~/features/experiments/index.js";

/** A single "thing you can edit" within an experiment: the control, or one of its variants. */
export interface VariantOption {
    // `null` identifies the control (the baseline page); otherwise the variant entry id.
    id: string | null;
    name: string;
    weight: number;
    isControl: boolean;
}

interface ExperimentsEditorContextValue {
    pageEntryId: string;
    baselineRevisionId: string;
    experiments: ExperimentDto[];
    reload: () => Promise<void>;
    selectedExperimentId: string | null;
    selectedExperiment: ExperimentDto | null;
    selectExperiment: (id: string | null) => void;
    // Currently edited bucket: `null` = control, otherwise a variant entry id.
    selectedVariantId: string | null;
    selectVariant: (variantId: string | null) => void;
    // The variant DTO matching `selectedVariantId` (null when editing the control).
    selectedVariant: VariantDto | null;
    variantOptions: VariantOption[];
    openManage: () => void;
    editExperiment: (experiment: ExperimentDto) => void;
    // Kill-switch state of the selected experiment, and toggles for it.
    paused: boolean;
    pauseSelected: () => Promise<void>;
    resumeSelected: () => Promise<void>;
}

const ExperimentsEditorContext = createContext<ExperimentsEditorContextValue | null>(null);

export const useExperimentsEditor = (): ExperimentsEditorContextValue => {
    const context = useContext(ExperimentsEditorContext);
    if (!context) {
        throw new Error("useExperimentsEditor must be used within an ExperimentsEditorProvider.");
    }
    return context;
};

interface ProviderProps {
    // Revision id of the page being edited (e.g. "<entryId>#0001"); the baseline for its experiments.
    pageRevisionId: string;
    children: React.ReactNode;
}

export const ExperimentsEditorProvider = ({ pageRevisionId, children }: ProviderProps) => {
    const pageEntryId = pageRevisionId.split("#")[0];

    const { gateway, listExperiments } = useExperiments();

    const [experiments, setExperiments] = useState<ExperimentDto[]>([]);
    const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
    const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
    const [variants, setVariants] = useState<VariantDto[]>([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<ExperimentDto | null>(null);
    const [paused, setPaused] = useState(false);

    const reload = useCallback(async () => {
        const list = await listExperiments(pageEntryId).catch(() => [] as ExperimentDto[]);
        setExperiments(list);
        // Drop the selection if the experiment no longer exists.
        setSelectedExperimentId(current =>
            current && list.some(experiment => experiment.id === current) ? current : null
        );
    }, [pageEntryId, listExperiments]);

    useEffect(() => {
        reload();
    }, [reload]);

    const selectedExperiment = useMemo(
        () => experiments.find(experiment => experiment.id === selectedExperimentId) ?? null,
        [experiments, selectedExperimentId]
    );

    // Load the variants of the selected experiment; reset the edited bucket to the control.
    useEffect(() => {
        let cancelled = false;
        setSelectedVariantId(null);
        if (!selectedExperimentId) {
            setVariants([]);
            return;
        }
        gateway
            .listVariants(selectedExperimentId)
            .then(list => {
                if (!cancelled) {
                    setVariants(list);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setVariants([]);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [selectedExperimentId, gateway]);

    const selectedVariant = useMemo<VariantDto | null>(
        () => variants.find(variant => variant.entryId === selectedVariantId) ?? null,
        [variants, selectedVariantId]
    );

    // Load the kill-switch state for the selected running experiment (keyed on its entryId).
    const selectedEntryId = selectedExperiment?.entryId;
    const selectedIsRunning = selectedExperiment?.status === "running";
    useEffect(() => {
        let cancelled = false;
        if (!selectedEntryId || !selectedIsRunning) {
            setPaused(false);
            return;
        }
        gateway
            .getExperimentPaused(selectedEntryId)
            .then(value => {
                if (!cancelled) {
                    setPaused(value);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setPaused(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [selectedEntryId, selectedIsRunning, gateway]);

    const pauseSelected = useCallback(async () => {
        if (!selectedExperiment) {
            return;
        }
        await gateway.pauseExperiment(selectedExperiment.entryId);
        setPaused(true);
    }, [selectedExperiment, gateway]);

    const resumeSelected = useCallback(async () => {
        if (!selectedExperiment) {
            return;
        }
        await gateway.resumeExperiment(selectedExperiment.entryId);
        setPaused(false);
    }, [selectedExperiment, gateway]);

    const variantOptions = useMemo<VariantOption[]>(() => {
        const split = selectedExperiment?.trafficSplit ?? { control: 0, variants: {} };
        return [
            { id: null, name: "Control", weight: split.control ?? 0, isControl: true },
            ...variants.map(variant => ({
                id: variant.entryId,
                name: variant.name,
                weight: split.variants?.[variant.entryId] ?? 0,
                isControl: false
            }))
        ];
    }, [selectedExperiment, variants]);

    const openManage = useCallback(() => {
        setEditTarget(null);
        setDrawerOpen(true);
    }, []);

    const editExperiment = useCallback((experiment: ExperimentDto) => {
        setEditTarget(experiment);
        setDrawerOpen(true);
    }, []);

    const value = useMemo<ExperimentsEditorContextValue>(
        () => ({
            pageEntryId,
            baselineRevisionId: pageRevisionId,
            experiments,
            reload,
            selectedExperimentId,
            selectedExperiment,
            selectExperiment: setSelectedExperimentId,
            selectedVariantId,
            selectVariant: setSelectedVariantId,
            selectedVariant,
            variantOptions,
            openManage,
            editExperiment,
            paused,
            pauseSelected,
            resumeSelected
        }),
        [
            pageEntryId,
            pageRevisionId,
            experiments,
            reload,
            selectedExperimentId,
            selectedExperiment,
            selectedVariantId,
            selectedVariant,
            variantOptions,
            openManage,
            editExperiment,
            paused,
            pauseSelected,
            resumeSelected
        ]
    );

    return (
        <ExperimentsEditorContext.Provider value={value}>
            {children}
            <ExperimentsDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                experiments={experiments}
                pageEntryId={pageEntryId}
                baselineRevisionId={pageRevisionId}
                initialEdit={editTarget}
                onChanged={reload}
            />
        </ExperimentsEditorContext.Provider>
    );
};
