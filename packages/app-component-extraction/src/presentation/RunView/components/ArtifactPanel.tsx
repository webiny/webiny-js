import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Heading, Scrollbar, Tag, Text } from "@webiny/admin-ui";
import { STAGE_LABELS, type Stage } from "~/constants.js";
import { stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../abstractions.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

/**
 * The raw stage record for the selected stage — its status, timing, artifact references and any error.
 * Phase 1 shows the ledger entry verbatim; richer per-artifact views come later.
 */
export const ArtifactPanel = createReactiveComponent(function ArtifactPanel({ presenter }: Props) {
    const { vm } = presenter;
    const run = vm.run;
    const stage = vm.selectedStage as Stage | null;

    if (!run || !stage) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Text className="text-neutral-strong">Select a stage to inspect its output.</Text>
            </div>
        );
    }

    const entry = stageEntry(run, stage);

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-center gap-sm px-md py-sm border-b border-neutral-dimmed">
                <Heading level={6}>{STAGE_LABELS[stage]}</Heading>
                {entry ? <Tag variant="neutral-muted" content={entry.status} /> : null}
            </div>
            <Scrollbar>
                {entry?.error ? (
                    <div className="px-md py-sm border-b border-destructive-dimmed bg-destructive-subtle">
                        <Text size="sm" className="text-destructive-default">
                            {entry.error}
                        </Text>
                    </div>
                ) : null}
                <pre className="p-md text-sm whitespace-pre-wrap break-words font-mono">
                    {entry ? JSON.stringify(entry, null, 2) : "This stage has not run yet."}
                </pre>
            </Scrollbar>
        </div>
    );
});
