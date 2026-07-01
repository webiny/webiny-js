import React, { useEffect, useState } from "react";
import { Drawer, IconButton } from "@webiny/admin-ui";
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
    onChanged: () => void | Promise<void>;
}

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

export const ExperimentsDrawer = ({
    open,
    onClose,
    experiments,
    pageEntryId,
    baselineRevisionId,
    onChanged
}: Props) => {
    const { gateway, createExperiment } = useExperiments();
    const [view, setView] = useState<View>("list");
    const [editId, setEditId] = useState<string | null>(null);
    const [editInitial, setEditInitial] = useState<ExperimentFormInitial | null>(null);

    useEffect(() => {
        if (open) {
            setView("list");
            setEditId(null);
            setEditInitial(null);
        }
    }, [open]);

    const handleCreate = async (payload: NewExperimentPayload) => {
        await createExperiment({ pageEntryId, baselineRevisionId, payload });
        await onChanged();
        setView("list");
    };

    const startEdit = async (experiment: ExperimentDto) => {
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
                key: slugify(variant.name),
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
    };

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
