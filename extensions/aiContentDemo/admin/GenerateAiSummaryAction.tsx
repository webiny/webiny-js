import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AiIcon } from "webiny/admin/icons/auto_awesome.svg";
import { BulkActionButton, useBulkActionDialog, useFeature } from "webiny/admin";
import { DropdownMenu, useToast } from "webiny/admin/ui";
import { useModel } from "webiny/admin/cms";
import { BulkActionFeature, useContentEntriesPresenter } from "webiny/admin/cms/entry/list";
import { GetSettingsFeature } from "webiny/admin/ai-powerups";

interface Preset {
    id: string;
    name: string;
}

interface AiContext {
    readers: Preset[];
    writers: Preset[];
    projects: Preset[];
}

// One of these ids is forwarded to the backend as the AI Power Ups context.
type ContextChoice =
    | { projectId: string }
    | { writerPersonaId: string }
    | { readerPersonaId: string }
    | undefined;

/**
 * "Generate AI summary" bulk-action button, as a dropdown of AI Power Ups contexts:
 * Projects (bundled instructions + default personas), Writer Personas (tone) and Reader
 * Personas (audience). Picking one triggers the background task with that context, so the
 * AI follows the user's configured setup. "Default" runs with none.
 */
export const GenerateAiSummaryAction = observer(() => {
    const { model } = useModel();
    const presenter = useContentEntriesPresenter();
    const { showConfirmationDialog } = useBulkActionDialog();
    const { showSuccessToast } = useToast();
    const { useCase: bulkAction } = useFeature(BulkActionFeature);
    const { useCase: getSettings } = useFeature(GetSettingsFeature);

    const [ctx, setCtx] = useState<AiContext>({ readers: [], writers: [], projects: [] });

    useEffect(() => {
        let active = true;
        getSettings
            .execute()
            .then(settings => {
                if (!active) {
                    return;
                }
                setCtx({
                    readers: settings.readerPersonas?.presets ?? [],
                    writers: settings.writerPersonas?.presets ?? [],
                    projects: settings.projects?.presets ?? []
                });
            })
            .catch(() => {
                // AI Power Ups may not be configured — just show "Default".
            });
        return () => {
            active = false;
        };
    }, [getSettings]);

    const selection = presenter.list.vm.selection;
    const selectedItems = presenter.list.vm.rows.filter(row => selection.selectedIds.has(row.id));

    const run = (choice: ContextChoice, label: string) =>
        showConfirmationDialog({
            title: "Generate AI summary",
            message: `Generate an AI summary for ${selection.label} (${label})? This runs as a background task, so you can keep working while it processes.`,
            loadingLabel: "Starting background task…",
            execute: async () => {
                // A fresh token per click. The task converges once every targeted entry is
                // stamped with it (`values.aiSummarizedRun_not: runId`), but the next click
                // uses a new token, so the same entries can be summarized again.
                const runId =
                    typeof crypto !== "undefined" && crypto.randomUUID
                        ? crypto.randomUUID()
                        : String(Date.now());

                const scope = selection.allSelected
                    ? {}
                    : { id_in: selectedItems.map(item => item.id) };
                const where = { ...scope, "values.aiSummarizedRun_not": runId };

                await bulkAction.execute({
                    model,
                    action: "GenerateAiSummary",
                    where,
                    data: { ...(choice ?? {}), runId }
                });

                presenter.list.actions.selection.deselectAll();

                showSuccessToast({
                    title: "AI summary task started",
                    description: "Generating summaries in the background. You can keep working."
                });
            }
        });

    return (
        <DropdownMenu
            trigger={
                <BulkActionButton
                    text={"Generate AI summary"}
                    tooltipContent={`Generate an AI summary for ${selection.label}`}
                    icon={<AiIcon />}
                />
            }
        >
            <DropdownMenu.Item
                text={"Default (no context)"}
                onClick={() => run(undefined, "default")}
            />

            {ctx.projects.length > 0 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Label text={"Projects"} />
                    {ctx.projects.map(p => (
                        <DropdownMenu.Item
                            key={p.id}
                            text={p.name}
                            onClick={() => run({ projectId: p.id }, `project: ${p.name}`)}
                        />
                    ))}
                </>
            ) : null}

            {ctx.writers.length > 0 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Label text={"Writer personas"} />
                    {ctx.writers.map(p => (
                        <DropdownMenu.Item
                            key={p.id}
                            text={p.name}
                            onClick={() => run({ writerPersonaId: p.id }, `writer: ${p.name}`)}
                        />
                    ))}
                </>
            ) : null}

            {ctx.readers.length > 0 ? (
                <>
                    <DropdownMenu.Separator />
                    <DropdownMenu.Label text={"Reader personas"} />
                    {ctx.readers.map(p => (
                        <DropdownMenu.Item
                            key={p.id}
                            text={p.name}
                            onClick={() => run({ readerPersonaId: p.id }, `reader: ${p.name}`)}
                        />
                    ))}
                </>
            ) : null}
        </DropdownMenu>
    );
});
