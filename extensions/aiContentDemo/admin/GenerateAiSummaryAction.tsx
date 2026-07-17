import React, { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { ReactComponent as AiIcon } from "webiny/admin/icons/auto_awesome.svg";
import { BulkActionButton, useBulkActionDialog, useFeature } from "webiny/admin";
import { DropdownMenu, useToast } from "webiny/admin/ui";
import { useModel } from "webiny/admin/cms";
import { BulkActionFeature, useContentEntriesPresenter } from "webiny/admin/cms/entry/list";
import { GetSettingsFeature } from "webiny/admin/ai-powerups";

interface Persona {
    id: string;
    name: string;
}

/**
 * "Generate AI summary" bulk-action button, as a dropdown of Writer Personas.
 *
 * Personas come from AI Power Ups settings (GetSettingsFeature). Picking one triggers the
 * background task with that persona's id, so the AI follows the user's configured
 * instructions/tone. "Default" runs with no persona.
 */
export const GenerateAiSummaryAction = observer(() => {
    const { model } = useModel();
    const presenter = useContentEntriesPresenter();
    const { showConfirmationDialog } = useBulkActionDialog();
    const { showSuccessToast } = useToast();
    const { useCase: bulkAction } = useFeature(BulkActionFeature);
    const { useCase: getSettings } = useFeature(GetSettingsFeature);

    const [personas, setPersonas] = useState<Persona[]>([]);

    useEffect(() => {
        let active = true;
        getSettings
            .execute()
            .then(settings => {
                if (active) {
                    setPersonas(settings.writerPersonas?.presets ?? []);
                }
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

    const run = (writerPersonaId?: string) =>
        showConfirmationDialog({
            title: "Generate AI summary",
            message: `Generate an AI summary for ${selection.label}${writerPersonaId ? " using the selected persona" : ""}? This runs as a background task, so you can keep working while it processes.`,
            loadingLabel: "Starting background task…",
            execute: async () => {
                const where = selection.allSelected
                    ? undefined
                    : { id_in: selectedItems.map(item => item.id) };

                await bulkAction.execute({
                    model,
                    action: "GenerateAiSummary",
                    where,
                    data: writerPersonaId ? { writerPersonaId } : undefined
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
            <DropdownMenu.Item text={"Default (no persona)"} onClick={() => run()} />
            {personas.map(persona => (
                <DropdownMenu.Item
                    key={persona.id}
                    text={persona.name}
                    onClick={() => run(persona.id)}
                />
            ))}
        </DropdownMenu>
    );
});
