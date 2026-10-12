import React, { useState } from "react";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
    Alert,
    Button,
    CheckboxPrimitive,
    Input,
    SegmentedControl,
    Tag,
    Text,
    cn
} from "@webiny/admin-ui";
import { Routes } from "~/routes.js";
import { namespaceSegment, qualify } from "~/shared/naming.js";
import { stageEntry } from "~/shared/ledger.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    ComponentDecisionDto,
    GeneratedComponentDto,
    OverrideDto,
    PromoteArtifactDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

// The module has no version history, so there is no "New version" choice the design shows — only Replace
// the existing component in place, or Keep both under a new name.
const RESOLUTION_OPTIONS = [
    { value: "replace", label: "Replace" },
    { value: "keepBoth", label: "Keep both" }
];

// Carried on the artifact rather than derived, because the aggregate references its components
// instead of holding their cluster members.
const pageCountOf = (component: GeneratedComponentDto): number => component.pageCount;

/** Promotable = editability-critical validators pass, and the operator hasn't rejected/withheld it. */
const isPromotable = (
    component: GeneratedComponentDto,
    decisions: Record<string, ComponentDecisionDto>,
    hasDecisions: boolean
): boolean => {
    const decision = decisions[component.signature];
    if (decision === "rejected" || (hasDecisions && decision !== "accepted")) {
        return false;
    }
    return (
        component.validation.textPreservation.passed &&
        component.validation.contractConformance.passed
    );
};

const promoteOverride = (
    overrides: OverrideDto[],
    signature: string,
    kind: string
): OverrideDto | undefined =>
    overrides.find(
        override =>
            override.stage === "promote" &&
            override.structuralSignature === signature &&
            override.correction.kind === kind
    );

/** Whether a component is selected for promotion (default true until an override says otherwise). */
const isSelected = (overrides: OverrideDto[], signature: string): boolean => {
    const override = promoteOverride(overrides, signature, "promote.select");
    return override ? Boolean(override.correction.selected) : true;
};

const PromoteRow = ({
    presenter,
    component,
    qualifiedName,
    collides,
    promoted
}: {
    presenter: RunViewPresenter.Interface;
    component: GeneratedComponentDto;
    qualifiedName: string;
    collides: boolean;
    promoted: boolean;
}) => {
    const { vm } = presenter;
    const signature = component.signature;
    const selected = isSelected(vm.overrides, signature);
    const collisionOverride = promoteOverride(vm.overrides, signature, "promote.collision");
    const resolution = (collisionOverride?.correction.resolution as string) ?? "keepBoth";
    const [renameTo, setRenameTo] = useState(
        (collisionOverride?.correction.renameTo as string) ?? `${qualifiedName} (2)`
    );
    const pages = pageCountOf(component);
    // A promoted component's name is (correctly) now in the Library, so its collision is expected, not a
    // warning — suppress the conflict treatment once it has been promoted.
    const conflict = collides && selected && !promoted;

    const commitRename = () => {
        if (renameTo.trim()) {
            void presenter.setPromoteCollision(signature, "keepBoth", renameTo.trim());
        }
    };

    return (
        <div
            className={cn(
                "flex flex-col gap-xs border-b border-neutral-dimmed px-md py-sm",
                conflict && "bg-warning-subtle"
            )}
        >
            <div className="flex items-center gap-sm">
                <CheckboxPrimitive
                    checked={selected}
                    disabled={vm.clusterBusy}
                    onChange={() => void presenter.setPromoteSelection(signature, !selected)}
                />
                <Text size="sm" className="min-w-0 flex-1 truncate font-mono">
                    {qualifiedName}
                </Text>
                <Tag variant="neutral-muted" content={component.type} />
                <Text size="sm" className="whitespace-nowrap text-neutral-strong">
                    {pages} page{pages === 1 ? "" : "s"}
                </Text>
                {promoted ? <Tag variant="success-light" content="Approved" /> : null}
            </div>
            {conflict ? (
                <div className="flex flex-col gap-xs pl-lg">
                    <Text size="sm" className="text-warning-strong">
                        Name conflict — this name already exists in the Library.
                    </Text>
                    <div className="flex items-center gap-sm">
                        <SegmentedControl
                            items={RESOLUTION_OPTIONS}
                            value={resolution}
                            onChange={(value: string) =>
                                void presenter.setPromoteCollision(
                                    signature,
                                    value as "replace" | "keepBoth",
                                    value === "keepBoth" ? renameTo.trim() : undefined
                                )
                            }
                        />
                        {resolution === "keepBoth" ? (
                            <div className="min-w-0 flex-1">
                                <Input
                                    value={renameTo}
                                    placeholder="New name"
                                    disabled={vm.clusterBusy}
                                    onChange={(value: string) => setRenameTo(value)}
                                    onBlur={commitRename}
                                    onEnter={commitRename}
                                />
                            </div>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </div>
    );
};

/**
 * The Promote gate (spec §6.9). Lists the generated components eligible for promotion — checkbox, name
 * (mono), page count — with a summary of how many are selected and how many collide with a Library name.
 * A conflicting, selected component takes a warning treatment and an inline choice: Replace the existing
 * component in place, or Keep both under a new name. (No "New version": the module has no version history.)
 * Selection and collision are stored as overrides that reattach across runs; the primary action runs
 * Promote, and once it has, the screen links through to the Library.
 */
export const PromoteView = createReactiveComponent(function PromoteView({ presenter }: Props) {
    const { vm } = presenter;
    const { goToRoute } = useRouter();
    // Only this stage's artifact: on a tab switch the previous stage's is still loaded for a render,
    // and another stage's shape here crashes the view (Plan's components carry no validation).
    const result =
        vm.artifactStage === "promote" ? (vm.artifact as PromoteArtifactDto | null) : null;
    const promoting = vm.actionStage === "promote";
    const running = vm.run ? stageEntry(vm.run, "promote")?.status === "running" : false;
    const hasDecisions = Object.keys(vm.decisions).length > 0;
    const library = new Set(vm.libraryNames);
    // Promoted components are namespaced under the extraction (see PromoteHandler), so preview and
    // collision-detect against the same qualified name the API will create.
    const namespace = namespaceSegment(vm.job?.name ?? "");

    const promotable = vm.promoteComponents.filter(component =>
        isPromotable(component, vm.decisions, hasDecisions)
    );
    const named = promotable.map(component => ({
        component,
        qualifiedName: qualify(namespace, component.name)
    }));
    const promotedSignatures = new Set((result?.promoted ?? []).map(entry => entry.signature));
    const selectedCount = named.filter(item =>
        isSelected(vm.overrides, item.component.signature)
    ).length;
    // A promoted component's name is expected to be in the Library — don't count it as a conflict.
    const conflicts = named.filter(
        item => library.has(item.qualifiedName) && !promotedSignatures.has(item.component.signature)
    ).length;
    const promoted = result?.promoted.length ?? 0;
    const skipped = result?.skipped.length ?? 0;
    // Why components did not reach the Library. A component that cannot be bundled is skipped rather
    // than stored unplaceable, so this is the only place an operator can find that out. Grouped,
    // because a whole run tends to fail the same way. Truncated: the reason carries a bundler error.
    const skipReasons = [
        ...(result?.skipped ?? []).reduce((counts, entry) => {
            const reason = entry.reason ? entry.reason.slice(0, 120) : "no reason recorded";
            return counts.set(reason, (counts.get(reason) ?? 0) + 1);
        }, new Map<string, number>())
    ].sort((a, b) => b[1] - a[1]);

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-start justify-between gap-md border-b border-neutral-dimmed px-md py-sm">
                <div className="flex min-w-0 flex-col gap-xxs">
                    <Text size="sm" className="font-medium">
                        {selectedCount} of {promotable.length} selected ·{" "}
                        {conflicts > 0
                            ? `${conflicts} name conflict${conflicts === 1 ? "" : "s"} with the Library`
                            : "no name conflicts"}
                    </Text>
                    {result ? (
                        <Text size="sm" className="text-neutral-strong">
                            Last run: approved {result.promoted.length}, skipped{" "}
                            {result.skipped.length}
                        </Text>
                    ) : null}
                    {skipReasons.length > 0 ? (
                        <div className="flex flex-col gap-xxs">
                            {skipReasons.map(([reason, count]) => (
                                <Text key={reason} size="sm" className="text-neutral-strong">
                                    {count} × {reason}
                                </Text>
                            ))}
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-shrink-0 items-center gap-sm">
                    {promoted > 0 ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            text="Open Library"
                            onClick={() => goToRoute(Routes.List)}
                        />
                    ) : null}
                    {/*
                     * Secondary once something is approved: "Go to Site" below is then the way
                     * forward, and two primary actions side by side is the duplicate every other gate
                     * dropped. Re-approving a changed selection stays possible.
                     */}
                    <Button
                        variant={promoted > 0 ? "secondary" : "primary"}
                        size="sm"
                        text={promoting ? "Starting…" : running ? "Approving…" : "Approve selected"}
                        disabled={promoting || running || selectedCount === 0}
                        onClick={() => void presenter.runStage("promote")}
                    />
                </div>
            </div>

            {running ? (
                <div className="px-md pt-sm">
                    <Alert type="info" variant="subtle">
                        Approving {selectedCount} component{selectedCount === 1 ? "" : "s"}: bundling
                        them into this workspace&apos;s Library, ready to go into a site…
                    </Alert>
                </div>
            ) : null}
            {promoted > 0 && !running ? (
                <div className="px-md pt-sm">
                    <Alert type="success" variant="subtle">
                        Approved {promoted} component{promoted === 1 ? "" : "s"}, held in this
                        workspace&apos;s Library
                        {skipped > 0 ? ` · ${skipped} skipped` : ""}.
                    </Alert>
                </div>
            ) : null}
            {promoted > 0 && !running ? (
                <div className="flex flex-wrap items-center gap-sm px-md pt-sm">
                    <Text size="sm" className="text-neutral-strong">
                        Components approved. Next: the site, where the migrated pages are published.
                    </Text>
                    <Button
                        variant="primary"
                        size="sm"
                        text="Go to Site"
                        onClick={() => presenter.openSite()}
                    />
                </div>
            ) : null}

            {!vm.promoteGateLoaded ? (
                <Text size="sm" className="px-md py-sm text-neutral-strong">
                    Loading the components to approve…
                </Text>
            ) : promotable.length === 0 ? (
                <Text size="sm" className="px-md py-sm text-neutral-strong">
                    No components are eligible — generate and accept components first.
                </Text>
            ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                    {named.map(({ component, qualifiedName }) => (
                        <PromoteRow
                            key={component.signature}
                            presenter={presenter}
                            component={component}
                            qualifiedName={qualifiedName}
                            collides={library.has(qualifiedName)}
                            promoted={promotedSignatures.has(component.signature)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
