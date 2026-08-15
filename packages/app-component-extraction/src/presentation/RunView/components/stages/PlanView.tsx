import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Alert, Button, Heading, Input, Select, Tag, Text } from "@webiny/admin-ui";
import { RunImage } from "~/presentation/runImage/RunImage.js";
import type { RunViewPresenter } from "../../abstractions.js";
import type {
    ComponentPropDto,
    OverrideDto,
    PlanArtifactDto,
    PlannedComponentDto
} from "~/shared/types.js";

interface Props {
    presenter: RunViewPresenter.Interface;
}

const num = (value: number): string => value.toLocaleString();

const PROP_TYPES = ["text", "richText", "image", "url", "boolean", "number", "object"].map(
    value => ({
        value,
        label: value
    })
);

const pageCountOf = (component: PlannedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

const hasOverride = (overrides: OverrideDto[], signature: string): boolean =>
    overrides.some(
        override => override.stage === "plan" && override.structuralSignature === signature
    );

/** One editable prop: rename (commit on blur/enter), retype, or remove. */
const PropRow = ({
    presenter,
    signature,
    prop
}: {
    presenter: RunViewPresenter.Interface;
    signature: string;
    prop: ComponentPropDto;
}) => {
    const { vm } = presenter;
    const [name, setName] = useState(prop.name);

    const commitName = () => {
        if (name.trim() && name.trim() !== prop.name) {
            void presenter.setPlanProp(signature, "edit", prop.name, { newName: name.trim() });
        }
    };
    const typeOptions = PROP_TYPES.some(option => option.value === prop.type)
        ? PROP_TYPES
        : [{ value: prop.type, label: prop.type }, ...PROP_TYPES];

    return (
        <div className="flex items-center gap-sm">
            <div className="flex-1 min-w-0">
                <Input
                    value={name}
                    disabled={vm.clusterBusy}
                    onChange={(value: string) => setName(value)}
                    onBlur={commitName}
                    onEnter={commitName}
                />
            </div>
            <div className="w-32 flex-shrink-0">
                <Select
                    value={prop.type}
                    options={typeOptions}
                    disabled={vm.clusterBusy}
                    onChange={(value: string) =>
                        void presenter.setPlanProp(signature, "edit", prop.name, { type: value })
                    }
                />
            </div>
            <Button
                variant="tertiary"
                size="sm"
                text="Remove"
                disabled={vm.clusterBusy}
                onClick={() => void presenter.setPlanProp(signature, "remove", prop.name)}
            />
        </div>
    );
};

const PlanComponentCard = ({
    presenter,
    component,
    corrected,
    runId,
    onOpenImage
}: {
    presenter: RunViewPresenter.Interface;
    component: PlannedComponentDto;
    corrected: boolean;
    runId: string;
    onOpenImage: (src: string, alt: string) => void;
}) => {
    const { vm } = presenter;
    const [expanded, setExpanded] = useState(false);
    const [newPropName, setNewPropName] = useState("");
    const [newPropType, setNewPropType] = useState("text");
    const [showInstruction, setShowInstruction] = useState(false);
    const [instruction, setInstruction] = useState("");
    const regenerating = vm.planRegenerating.includes(component.signature);

    const submitRegenerate = () => {
        void presenter.regeneratePlanComponent(
            component.signature,
            instruction.trim() || undefined
        );
        setInstruction("");
        setShowInstruction(false);
    };

    const addProp = () => {
        if (newPropName.trim()) {
            void presenter.setPlanProp(component.signature, "add", newPropName.trim(), {
                type: newPropType
            });
            setNewPropName("");
        }
    };

    return (
        <div className="border border-neutral-dimmed rounded-sm">
            <div className="flex items-center justify-between gap-sm px-sm py-xs">
                <div className="flex items-center gap-sm min-w-0">
                    <div
                        className="w-16 flex-shrink-0 aspect-[3/2] bg-neutral-light rounded-xs overflow-hidden"
                        title="Click to view full size"
                    >
                        <RunImage
                            runId={runId}
                            imageRef={component.representativeCrop.cropRef}
                            alt={component.name}
                            className="w-full h-full object-cover object-top"
                            onOpen={src => onOpenImage(src, component.name)}
                        />
                    </div>
                    <Text size="sm" className="font-medium truncate">
                        {component.name}
                    </Text>
                    <Tag variant="neutral-muted" content={component.type} />
                    {corrected ? <Tag variant="accent" content="corrected" /> : null}
                </div>
                <div className="flex items-center gap-sm flex-shrink-0">
                    <Text size="sm" className="text-neutral-strong whitespace-nowrap">
                        {pageCountOf(component)} page(s)
                    </Text>
                    <Button
                        variant="tertiary"
                        size="sm"
                        text={
                            regenerating
                                ? "Regenerating…"
                                : showInstruction
                                  ? "Cancel"
                                  : "Regenerate props"
                        }
                        disabled={regenerating || vm.clusterBusy}
                        title="Re-propose all props and token bindings for this component"
                        onClick={() => setShowInstruction(open => !open)}
                    />
                    <Text
                        size="sm"
                        className="text-primary cursor-pointer hover:underline"
                        onClick={() => setExpanded(prev => !prev)}
                    >
                        {expanded ? "Hide props" : `${component.props.length} props`}
                    </Text>
                </div>
            </div>
            {showInstruction && !regenerating ? (
                <div className="flex items-center gap-sm px-sm py-xs border-t border-neutral-dimmed">
                    <div className="flex-1 min-w-0">
                        <Input
                            value={instruction}
                            placeholder="Optional guidance, e.g. add a background image prop and split the CTA into label + URL"
                            disabled={vm.clusterBusy}
                            onChange={(value: string) => setInstruction(value)}
                            onEnter={submitRegenerate}
                        />
                    </div>
                    <Button
                        variant="primary"
                        size="sm"
                        text="Regenerate"
                        disabled={vm.clusterBusy}
                        onClick={submitRegenerate}
                    />
                </div>
            ) : null}
            {expanded ? (
                <div className="flex flex-col gap-sm px-sm py-sm border-t border-neutral-dimmed">
                    <div className="flex flex-col gap-xs">
                        {component.props.map(prop => (
                            <PropRow
                                key={prop.name}
                                presenter={presenter}
                                signature={component.signature}
                                prop={prop}
                            />
                        ))}
                    </div>
                    <div className="flex items-center gap-sm">
                        <div className="flex-1 min-w-0">
                            <Input
                                value={newPropName}
                                placeholder="New prop name"
                                disabled={vm.clusterBusy}
                                onChange={(value: string) => setNewPropName(value)}
                                onEnter={addProp}
                            />
                        </div>
                        <div className="w-32 flex-shrink-0">
                            <Select
                                value={newPropType}
                                options={PROP_TYPES}
                                disabled={vm.clusterBusy}
                                onChange={(value: string) => setNewPropType(value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            text="Add prop"
                            disabled={!newPropName.trim() || vm.clusterBusy}
                            onClick={addProp}
                        />
                    </div>
                    {component.tokenBindings.length > 0 ? (
                        <div className="flex flex-col gap-xxs">
                            <Text size="sm" className="font-medium">
                                Token bindings (read-only)
                            </Text>
                            {component.tokenBindings.map((binding, index) => (
                                <Text
                                    key={index}
                                    size="sm"
                                    className="font-mono text-neutral-strong"
                                >
                                    {binding.target} → {binding.token}
                                </Text>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};

/**
 * The Plan gate (W7.9) + prop controls (W8.5). The gate projects Generate's cost — planned components ×
 * the mean tokens per generate call from prior runs — so approving is a decision. Each component expands
 * to edit its props (rename, retype, remove, add), which write plan.prop overrides that reattach across
 * runs. Token bindings are read-only: they come from the theme manifest and editing them by hand invites
 * bindings that fail the Generate validator.
 */
export const PlanView = createReactiveComponent(function PlanView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as PlanArtifactDto | null;
    const projection = vm.planProjection;
    const generating = vm.actionStage === "generate";
    const runId = vm.run?.id ?? "";
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

    if (vm.artifactLoading && !artifact?.components) {
        return <Text className="p-md text-neutral-strong">Loading plan…</Text>;
    }
    if (!artifact?.components?.length) {
        return (
            <Text className="p-md text-neutral-strong">Run Plan to produce a component plan.</Text>
        );
    }

    return (
        <div className="flex flex-col h-full min-h-0">
            <div className="flex items-start justify-between gap-md px-md py-sm border-b border-neutral-dimmed">
                <div className="flex flex-col gap-xxs min-w-0">
                    <Heading level={6}>Approve plan</Heading>
                    {projection ? (
                        projection.meanTokensPerCall !== null ? (
                            <Text size="sm" className="text-neutral-strong">
                                ~{num(projection.projectedTokens ?? 0)} tokens projected ·{" "}
                                {projection.components} component(s) × ~
                                {num(projection.meanTokensPerCall)}/call, from{" "}
                                {projection.priorRuns} prior run(s)
                            </Text>
                        ) : (
                            <Text size="sm" className="text-neutral-strong">
                                {projection.components} component(s) to generate · no prior run of
                                this job to project cost from
                            </Text>
                        )
                    ) : (
                        <Text size="sm" className="text-neutral-strong">
                            {artifact.components.length} component(s) to generate
                        </Text>
                    )}
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    text={generating ? "Starting…" : "Approve plan & generate"}
                    disabled={generating}
                    onClick={() => void presenter.runStage("generate")}
                />
            </div>

            <div className="px-md pt-sm">
                <Alert type="warning" variant="subtle">
                    Approving starts the paid part of the run — Generate makes a model call per
                    component.
                </Alert>
            </div>

            <div className="flex-1 overflow-y-auto p-md">
                <div className="flex flex-col gap-xs">
                    {artifact.components.map(component => (
                        <PlanComponentCard
                            key={component.signature}
                            presenter={presenter}
                            component={component}
                            corrected={hasOverride(vm.overrides, component.signature)}
                            runId={runId}
                            onOpenImage={(src, alt) => setLightbox({ src, alt })}
                        />
                    ))}
                </div>
            </div>

            {lightbox ? (
                <div
                    className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-xl cursor-pointer"
                    onClick={() => setLightbox(null)}
                    title="Click to close"
                >
                    <div className="max-h-full overflow-y-auto bg-neutral-base rounded-sm">
                        <img
                            src={lightbox.src}
                            alt={lightbox.alt}
                            className="w-[900px] max-w-full"
                        />
                    </div>
                </div>
            ) : null}
        </div>
    );
});
