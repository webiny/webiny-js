import React, { useState } from "react";
import { createReactiveComponent, useRouter } from "@webiny/app-admin";
import {
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

const pageCountOf = (component: GeneratedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

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
    collides
}: {
    presenter: RunViewPresenter.Interface;
    component: GeneratedComponentDto;
    qualifiedName: string;
    collides: boolean;
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
    const conflict = collides && selected;

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
    const result = vm.artifact as PromoteArtifactDto | null;
    const promoting = vm.actionStage === "promote";
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
    const selectedCount = named.filter(item =>
        isSelected(vm.overrides, item.component.signature)
    ).length;
    const conflicts = named.filter(item => library.has(item.qualifiedName)).length;
    const promoted = result?.promoted.length ?? 0;

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
                            Last run: promoted {result.promoted.length}, skipped{" "}
                            {result.skipped.length}
                        </Text>
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
                    <Button
                        variant="primary"
                        size="sm"
                        text={promoting ? "Starting…" : "Promote selected"}
                        disabled={promoting || selectedCount === 0}
                        onClick={() => void presenter.runStage("promote")}
                    />
                </div>
            </div>

            {promotable.length === 0 ? (
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
});
