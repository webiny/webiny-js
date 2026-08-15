import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Checkbox, Input, Select, Tag, Text } from "@webiny/admin-ui";
import type { RunViewPresenter } from "../../abstractions.js";
import { namespaceSegment, qualify } from "~/shared/naming.js";
import type {
    ComponentDecisionDto,
    GeneratedComponentDto,
    OverrideDto,
    PromoteArtifactDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const RESOLUTION_OPTIONS = [
    { value: "keepBoth", label: "Keep both" },
    { value: "replace", label: "Replace" }
];

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
    const selectOverride = promoteOverride(vm.overrides, signature, "promote.select");
    const collisionOverride = promoteOverride(vm.overrides, signature, "promote.collision");
    const selected = selectOverride ? Boolean(selectOverride.correction.selected) : true;
    const resolution = (collisionOverride?.correction.resolution as string) ?? "keepBoth";
    const [renameTo, setRenameTo] = useState(
        (collisionOverride?.correction.renameTo as string) ?? `${qualifiedName} (2)`
    );

    const commitRename = () => {
        if (renameTo.trim()) {
            void presenter.setPromoteCollision(signature, "keepBoth", renameTo.trim());
        }
    };

    return (
        <div className="flex flex-col gap-xs px-md py-sm border-b border-neutral-dimmed">
            <div className="flex items-center gap-sm">
                <Checkbox
                    checked={selected}
                    onChange={() => void presenter.setPromoteSelection(signature, !selected)}
                />
                <Text size="sm" className="font-medium truncate flex-1 min-w-0">
                    {qualifiedName}
                </Text>
                <Tag variant="neutral-muted" content={component.type} />
                {collides ? <Tag variant="warning" content="name in Library" /> : null}
            </div>
            {selected && collides ? (
                <div className="flex items-center gap-sm pl-lg">
                    <div className="w-40 flex-shrink-0">
                        <Select
                            label="On collision"
                            value={resolution}
                            options={RESOLUTION_OPTIONS}
                            disabled={vm.clusterBusy}
                            onChange={(value: string) =>
                                void presenter.setPromoteCollision(
                                    signature,
                                    value as "replace" | "keepBoth",
                                    value === "keepBoth" ? renameTo.trim() : undefined
                                )
                            }
                        />
                    </div>
                    {resolution === "keepBoth" ? (
                        <div className="flex-1 min-w-0">
                            <Input
                                label="New name"
                                value={renameTo}
                                disabled={vm.clusterBusy}
                                onChange={(value: string) => setRenameTo(value)}
                                onBlur={commitRename}
                                onEnter={commitRename}
                            />
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

/**
 * The Promote gate (W8.6). Lists the generated components eligible for promotion (validators pass, not
 * rejected), each with a selection checkbox and — when its name already exists in the Library — a
 * collision choice: Replace the existing component in place, or Keep both with a rename (there is no
 * "New version"; the module has no version history). Selection and collision are stored as overrides that
 * reattach across runs; the primary action runs Promote, which honours them.
 */
export const PromoteView = createReactiveComponent(function PromoteView({ presenter }: Props) {
    const { vm } = presenter;
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

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-start justify-between gap-md px-md py-sm border-b border-neutral-dimmed">
                <div className="flex flex-col gap-xxs min-w-0">
                    <Text size="sm" className="font-medium">
                        {promotable.length} component(s) ready to promote
                    </Text>
                    {result ? (
                        <Text size="sm" className="text-neutral-strong">
                            Last run: promoted {result.promoted.length}, skipped{" "}
                            {result.skipped.length}
                        </Text>
                    ) : null}
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    text={promoting ? "Starting…" : "Promote to Library"}
                    disabled={promoting}
                    onClick={() => void presenter.runStage("promote")}
                />
            </div>

            {promotable.length === 0 ? (
                <Text size="sm" className="px-md py-sm text-neutral-strong">
                    No components are eligible — generate and accept components first.
                </Text>
            ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="px-md pt-sm">
                        <Alert type="info" variant="subtle">
                            Selected components are promoted when you run Promote. A name already in
                            the Library shows a collision choice.
                        </Alert>
                    </div>
                    {promotable.map(component => {
                        const qualifiedName = qualify(namespace, component.name);
                        return (
                            <PromoteRow
                                key={component.signature}
                                presenter={presenter}
                                component={component}
                                qualifiedName={qualifiedName}
                                collides={library.has(qualifiedName)}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    );
});
