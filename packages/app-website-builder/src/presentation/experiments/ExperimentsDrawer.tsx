import React, { useCallback, useEffect, useState } from "react";
import slugify from "slugify";
import { Drawer, IconButton, Text } from "@webiny/admin-ui";
import { useConfirmationDialog, useSnackbar } from "@webiny/app-admin";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as BackIcon } from "@webiny/icons/arrow_back.svg";
import {
    NewExperimentForm,
    type ExperimentFormInitial,
    type NewExperimentPayload
} from "./NewExperimentForm.js";
import { ExperimentsListView } from "./ExperimentsListView.js";
import { useExperiments } from "./useExperiments.js";
import type { ExperimentDto } from "~/features/experiments/index.js";

type View = "list" | "create" | "edit";

interface Props {
    open: boolean;
    onClose: () => void;
    experiments: ExperimentDto[];
    pageEntryId: string;
    baselineRevisionId: string;
    // When set, the drawer opens straight into the edit view for this experiment.
    initialEdit?: ExperimentDto | null;
    onChanged: () => void | Promise<void>;
}

const toKey = (value: string): string => slugify(value, { lower: true, strict: true });

export const ExperimentsDrawer = ({
    open,
    onClose,
    experiments,
    pageEntryId,
    baselineRevisionId,
    initialEdit,
    onChanged
}: Props) => {
    const {
        gateway,
        createExperiment,
        activateExperiment,
        deactivateExperiment,
        deleteExperiment
    } = useExperiments();
    const { showSnackbar } = useSnackbar();
    const [view, setView] = useState<View>("list");
    const [editId, setEditId] = useState<string | null>(null);
    const [editInitial, setEditInitial] = useState<ExperimentFormInitial | null>(null);

    const handleCreate = async (payload: NewExperimentPayload) => {
        await createExperiment({ pageEntryId, baselineRevisionId, payload });
        await onChanged();
        setView("list");
    };

    const startEdit = useCallback(
        async (experiment: ExperimentDto) => {
            const variants = await gateway.listVariants(experiment.id);
            const split = experiment.trafficSplit ?? { control: 100, variants: {} };
            const buckets = [
                {
                    id: "control",
                    isControl: true,
                    name: "Control",
                    key: "control",
                    keyEdited: true,
                    description: "",
                    weight: split.control ?? 0
                },
                ...variants.map(variant => ({
                    id: variant.entryId,
                    isControl: false,
                    name: variant.name,
                    key: toKey(variant.name),
                    keyEdited: true,
                    description: "",
                    weight: split.variants?.[variant.entryId] ?? 0,
                    revisionId: variant.id
                }))
            ];
            setEditInitial({
                name: experiment.name,
                key: (experiment.analytics?.experimentKey as string | undefined) ?? "",
                buckets
            });
            setEditId(experiment.id);
            setView("edit");
        },
        [gateway]
    );

    // Reset the drawer whenever it opens: jump straight to editing when asked, otherwise the list.
    useEffect(() => {
        if (!open) {
            return;
        }
        setEditId(null);
        setEditInitial(null);
        if (initialEdit) {
            startEdit(initialEdit);
        } else {
            setView("list");
        }
    }, [open, initialEdit, startEdit]);

    const handleUpdate = async (payload: NewExperimentPayload) => {
        if (!editId) {
            return;
        }
        const variantSplit: Record<string, number> = {};
        for (const variant of payload.variants) {
            variantSplit[variant.id] = variant.weight;
        }
        await gateway.updateExperiment(editId, {
            name: payload.name,
            analytics: { provider: "posthog", experimentKey: payload.key },
            trafficSplit: { control: payload.control.weight, variants: variantSplit }
        });
        for (const variant of payload.variants) {
            if (variant.revisionId) {
                await gateway.updateVariant(variant.revisionId, { name: variant.name });
            }
        }
        await onChanged();
        setView("list");
    };

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
            await activateExperiment(experiment.id, experiments);
            showSnackbar(`"${experiment.name}" is now active.`);
            await onChanged();
        } catch (ex: any) {
            showSnackbar(ex.message || "Could not activate the experiment.");
        }
    };

    const handleDeactivate = async (experiment: ExperimentDto) => {
        try {
            await deactivateExperiment(experiment.id);
            showSnackbar(`"${experiment.name}" was deactivated.`);
            await onChanged();
        } catch (ex: any) {
            showSnackbar(ex.message || "Could not deactivate the experiment.");
        }
    };

    const handleDelete = (experiment: ExperimentDto) =>
        showConfirmation(async () => {
            try {
                await deleteExperiment(experiment.id);
                showSnackbar(`"${experiment.name}" was deleted.`);
                await onChanged();
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
            onClick={() => setView("list")}
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
            onClose={onClose}
            modal={true}
            width={520}
            title={title}
            headerSeparator={true}
            bodyPadding={false}
            className={"flex flex-col"}
        >
            {view === "list" ? (
                <ExperimentsListView
                    experiments={experiments}
                    onCreate={() => setView("create")}
                    onEdit={startEdit}
                    onActivate={handleActivate}
                    onDeactivate={handleDeactivate}
                    onDelete={handleDelete}
                />
            ) : null}
            {view === "create" ? (
                <NewExperimentForm
                    onCancel={() => setView("list")}
                    onSubmit={handleCreate}
                    submitLabel="Create experiment"
                />
            ) : null}
            {view === "edit" && editInitial ? (
                <NewExperimentForm
                    initial={editInitial}
                    allowStructureChange={false}
                    submitLabel="Save changes"
                    onCancel={() => setView("list")}
                    onSubmit={handleUpdate}
                />
            ) : null}
        </Drawer>
    );
};
