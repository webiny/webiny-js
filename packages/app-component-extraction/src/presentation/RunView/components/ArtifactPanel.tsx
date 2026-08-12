import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Heading, Loader, Scrollbar, Tag, Text, TimeAgo } from "@webiny/admin-ui";
import { STAGE_LABELS, type Stage } from "~/constants.js";
import { stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../abstractions.js";
import type { StageLogItem } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const LogLine = ({ item }: { item: StageLogItem }) => {
    const errored = item.type === "error";
    return (
        <div className="flex gap-sm py-xs border-b border-neutral-dimmed last:border-b-0">
            <Text
                size="sm"
                className={`flex-1 min-w-0 break-words ${errored ? "text-destructive-default" : ""}`}
            >
                {item.message}
            </Text>
            <Text size="sm" className="text-neutral-strong whitespace-nowrap shrink-0">
                <TimeAgo datetime={item.createdOn} />
            </Text>
        </div>
    );
};

/**
 * The selected stage's activity: its full task log trail (read from the Background Tasks store, so the
 * per-item log is here without leaving for CloudWatch), followed by the raw stage record for inspection.
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
    const logsForStage = vm.logsStage === stage ? vm.logs : [];

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

                <div className="px-md py-sm">
                    <Text size="sm" className="font-medium">
                        Activity log
                    </Text>
                    {vm.logsLoading && logsForStage.length === 0 ? (
                        <div className="py-md">
                            <Loader />
                        </div>
                    ) : logsForStage.length === 0 ? (
                        <Text size="sm" className="text-neutral-strong">
                            No log entries yet.
                        </Text>
                    ) : (
                        <div className="mt-xs">
                            {logsForStage.map((item, index) => (
                                <LogLine key={index} item={item} />
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-md py-sm border-t border-neutral-dimmed">
                    <Text size="sm" className="font-medium">
                        Stage record
                    </Text>
                    <pre className="mt-xs text-sm whitespace-pre-wrap break-words font-mono">
                        {entry ? JSON.stringify(entry, null, 2) : "This stage has not run yet."}
                    </pre>
                </div>
            </Scrollbar>
        </div>
    );
});
