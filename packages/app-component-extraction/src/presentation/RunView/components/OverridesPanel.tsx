import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Heading, Tag, Text } from "@webiny/admin-ui";
import { STAGE_LABELS, type Stage } from "~/constants.js";
import type { RunViewPresenter } from "../abstractions.js";
import type { CorrectionDto, OverrideDto, ReattachmentDto } from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const stageLabel = (stage: string): string => STAGE_LABELS[stage as Stage] ?? stage;

/** A one-line, human description of a correction for the panel. */
const describe = (correction: CorrectionDto): string => {
    switch (correction.kind) {
        case "cluster.merge":
            return "Merged clusters";
        case "cluster.split":
            return "Split members into a new cluster";
        case "cluster.move":
            return "Moved a member to another cluster";
        case "cluster.exclude":
            return "Excluded a cluster";
        case "cluster.threshold":
            return `Set the similarity threshold to ${String(correction.threshold)}`;
        case "classify.set":
            return `Set ${[correction.name && "name", correction.type && "type"]
                .filter(Boolean)
                .join(" and ")}`;
        case "plan.prop":
            return `${String(correction.op)} prop "${String(correction.propName)}"`;
        case "page.exclude":
            return "Excluded a page";
        case "generate.decision":
            return `Marked ${String(correction.decision)}`;
        case "generate.regenerate":
            return "Regenerated with an instruction";
        case "promote.select":
            return correction.selected ? "Selected for promotion" : "Deselected from promotion";
        case "promote.collision":
            return correction.resolution === "replace"
                ? "On collision: replace"
                : "On collision: keep both";
        default:
            return correction.kind;
    }
};

const ActiveRow = ({
    presenter,
    override,
    runId
}: {
    presenter: RunViewPresenter.Interface;
    override: OverrideDto;
    runId: string;
}) => {
    const thisRun = override.originRunId === runId;
    return (
        <div className="flex items-center gap-sm px-md py-sm border-b border-neutral-dimmed">
            <Tag variant="neutral-muted" content={stageLabel(override.stage)} />
            <div className="flex-1 min-w-0">
                <Text size="sm" className="truncate">
                    {describe(override.correction)}
                </Text>
            </div>
            {thisRun ? (
                <Tag variant="accent" content="set this run" />
            ) : (
                <span className="inline-flex items-center rounded-sm border border-dashed border-accent-default px-xs text-xs text-accent-default">
                    reattached
                </span>
            )}
            <Button
                variant="tertiary"
                size="sm"
                text="Clear"
                disabled={presenter.vm.clusterBusy}
                onClick={() => void presenter.clearOverride(override.id)}
            />
        </div>
    );
};

const UnreattachedRow = ({ reattachment }: { reattachment: ReattachmentDto }) => (
    <div className="flex items-start gap-sm px-md py-sm border-b border-neutral-dimmed">
        <Tag variant="neutral-muted" content={stageLabel(reattachment.stage)} />
        <div className="flex-1 min-w-0 flex flex-col gap-xxs">
            <Text size="sm">{reattachment.kind.replace(/^[a-z]+\./, "")}</Text>
            <Text size="sm" className="text-neutral-strong">
                {reattachment.reason ?? "No matching target this run."}
            </Text>
        </div>
        <Tag
            variant={reattachment.status === "conflicting" ? "warning" : "neutral-muted"}
            content={reattachment.status}
        />
    </div>
);

/**
 * The overrides panel (W8.7). "Active on this run" lists the job's corrections — each marked set-this-run
 * or reattached — with a Clear that removes the override and marks downstream stale. "Could not reattach"
 * lists the corrections that found no matching target this run, framed as a warning (a correction becoming
 * irrelevant when a site changes is a normal outcome, not an error).
 */
export const OverridesPanel = createReactiveComponent(function OverridesPanel({
    presenter
}: Props) {
    const { vm } = presenter;
    const runId = vm.run?.id ?? "";
    const unreattached = vm.reattachments.filter(entry => entry.status !== "applied");

    return (
        <div className="flex flex-col h-full min-h-0 overflow-y-auto">
            <div className="px-md py-sm border-b border-neutral-dimmed">
                <Heading level={6}>Active on this run</Heading>
            </div>
            {vm.overrides.length === 0 ? (
                <Text size="sm" className="px-md py-sm text-neutral-strong">
                    No corrections yet. Corrections you make on the stage views appear here and
                    reapply across runs.
                </Text>
            ) : (
                vm.overrides.map(override => (
                    <ActiveRow
                        key={override.id}
                        presenter={presenter}
                        override={override}
                        runId={runId}
                    />
                ))
            )}

            <div className="px-md py-sm border-b border-t border-neutral-dimmed mt-sm">
                <Heading level={6}>Could not reattach</Heading>
            </div>
            {unreattached.length === 0 ? (
                <Text size="sm" className="px-md py-sm text-neutral-strong">
                    Every correction found its target this run.
                </Text>
            ) : (
                <>
                    <div className="px-md pt-sm">
                        <Alert type="warning" variant="subtle">
                            These corrections found no matching target this run. A correction
                            becoming irrelevant when a site changes is normal — they stay on the
                            job.
                        </Alert>
                    </div>
                    {unreattached.map((entry, index) => (
                        <UnreattachedRow key={index} reattachment={entry} />
                    ))}
                </>
            )}
        </div>
    );
});
