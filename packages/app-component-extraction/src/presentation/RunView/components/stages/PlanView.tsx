import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Input, Select, Tag, Text, cn } from "@webiny/admin-ui";
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
    value => ({ value, label: value })
);

const pageCountOf = (component: PlannedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

const hasOverride = (overrides: OverrideDto[], signature: string): boolean =>
    overrides.some(
        override => override.stage === "plan" && override.structuralSignature === signature
    );

/** One prop row (spec §6.6): prop (mono, editable) · type · values observed · delete. */
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
    const observed = prop.observedValues?.length ? prop.observedValues.join(" · ") : "—";

    return (
        <div className="grid grid-cols-[1fr_120px_1fr_auto] items-center gap-sm">
            <Input
                value={name}
                disabled={vm.clusterBusy}
                onChange={(value: string) => setName(value)}
                onBlur={commitName}
                onEnter={commitName}
            />
            <Select
                value={prop.type}
                options={typeOptions}
                disabled={vm.clusterBusy}
                onChange={(value: string) =>
                    void presenter.setPlanProp(signature, "edit", prop.name, { type: value })
                }
            />
            <Text size="sm" className="truncate text-neutral-strong" title={observed}>
                {observed}
            </Text>
            <Button
                variant="tertiary"
                size="sm"
                text="Delete"
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
    themeLabel,
    onOpenImage
}: {
    presenter: RunViewPresenter.Interface;
    component: PlannedComponentDto;
    corrected: boolean;
    runId: string;
    themeLabel: string;
    onOpenImage: (src: string, alt: string) => void;
}) => {
    const { vm } = presenter;
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

    const boundTokens = [...new Set(component.tokenBindings.map(binding => binding.token))];

    return (
        <div className="flex flex-col rounded-lg border border-neutral-dimmed bg-neutral-base">
            <div className="flex items-start gap-sm p-sm">
                <div
                    className="aspect-[3/2] w-20 flex-shrink-0 overflow-hidden rounded-xs bg-neutral-light"
                    title="Click to view full size"
                >
                    <RunImage
                        runId={runId}
                        imageRef={component.representativeCrop.cropRef}
                        alt={component.name}
                        className="h-full w-full object-contain object-top"
                        onOpen={src => onOpenImage(src, component.name)}
                    />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                    <div className="flex items-center gap-sm">
                        <Text size="lg" className="truncate font-mono font-medium">
                            {component.name}
                        </Text>
                        <Tag variant="neutral-muted" content={component.type} />
                        {corrected ? <Tag variant="accent" content="corrected" /> : null}
                        <div className="flex-1" />
                        <Text size="sm" className="whitespace-nowrap text-neutral-strong">
                            {pageCountOf(component)} page(s)
                        </Text>
                    </div>
                    {boundTokens.length > 0 ? (
                        <Text size="sm" className="truncate text-neutral-strong">
                            Binds to {themeLabel} — {boundTokens.join(", ")}
                        </Text>
                    ) : (
                        <Text size="sm" className="text-neutral-strong">
                            No token bindings
                        </Text>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between gap-sm border-t border-neutral-dimmed px-sm py-xs">
                <Text size="sm" className="font-medium">
                    {component.props.length} prop{component.props.length === 1 ? "" : "s"}
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
            </div>

            {showInstruction && !regenerating ? (
                <div className="flex items-center gap-sm border-t border-neutral-dimmed px-sm py-xs">
                    <div className="min-w-0 flex-1">
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

            <div className="flex flex-col gap-sm border-t border-neutral-dimmed px-sm py-sm">
                {component.props.length > 0 ? (
                    <div className="grid grid-cols-[1fr_120px_1fr_auto] gap-sm">
                        {["Prop", "Type", "Values observed", ""].map(header => (
                            <Text
                                key={header}
                                size="sm"
                                className="uppercase tracking-wide text-neutral-strong"
                            >
                                {header}
                            </Text>
                        ))}
                    </div>
                ) : null}
                {component.props.map(prop => (
                    <PropRow
                        key={prop.name}
                        presenter={presenter}
                        signature={component.signature}
                        prop={prop}
                    />
                ))}
                <div className="grid grid-cols-[1fr_120px_auto] items-center gap-sm">
                    <Input
                        value={newPropName}
                        placeholder="New prop name"
                        disabled={vm.clusterBusy}
                        onChange={(value: string) => setNewPropName(value)}
                        onEnter={addProp}
                    />
                    <Select
                        value={newPropType}
                        options={PROP_TYPES}
                        disabled={vm.clusterBusy}
                        onChange={(value: string) => setNewPropType(value)}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        text="Add prop"
                        disabled={!newPropName.trim() || vm.clusterBusy}
                        onClick={addProp}
                    />
                </div>
            </div>
        </div>
    );
};

/** A labelled fact row in the summary panel. */
const Fact = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-sm">
        <Text size="sm" className="text-neutral-strong">
            {label}
        </Text>
        <Text size="sm" className="font-medium">
            {value}
        </Text>
    </div>
);

/**
 * The Plan gate (spec §6.6). Two columns: the component contract cards, and a sticky summary panel — the
 * counts, the projected generation cost, and the approve/back actions. Each card shows the token binding
 * line and an editable prop table (prop · type · values observed); corrections write plan.prop overrides
 * that reattach across runs. Approving starts Generate, the first paid stage.
 */
export const PlanView = createReactiveComponent(function PlanView({ presenter }: Props) {
    const { vm } = presenter;
    const artifact = vm.artifact as PlanArtifactDto | null;
    const projection = vm.planProjection;
    const generating = vm.actionStage === "generate";
    const runId = vm.run?.id ?? "";
    const themeLabel = `Theme v${vm.job?.themeVersion ?? "?"}`;
    const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

    if (vm.artifactLoading && !artifact?.components) {
        return <Text className="p-md text-neutral-strong">Loading plan…</Text>;
    }
    if (!artifact?.components?.length) {
        return (
            <Text className="p-md text-neutral-strong">Run Plan to produce a component plan.</Text>
        );
    }

    const components = artifact.components.length;
    const pages = new Set(
        artifact.components.flatMap(component => component.members.map(member => member.url))
    ).size;
    const totalProps = artifact.components.reduce(
        (sum, component) => sum + component.props.length,
        0
    );
    const estimated =
        projection && projection.projectedTokens != null
            ? `~${num(projection.projectedTokens)} tokens`
            : "—";

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto p-md">
                <div className="flex gap-md">
                    <div className="flex min-w-0 flex-1 flex-col gap-md">
                        {artifact.components.map(component => (
                            <PlanComponentCard
                                key={component.signature}
                                presenter={presenter}
                                component={component}
                                corrected={hasOverride(vm.overrides, component.signature)}
                                runId={runId}
                                themeLabel={themeLabel}
                                onOpenImage={(src, alt) => setLightbox({ src, alt })}
                            />
                        ))}
                    </div>

                    <div className="w-[300px] flex-shrink-0">
                        <div className="sticky top-0 flex flex-col gap-sm rounded-lg border border-primary-muted bg-neutral-base p-md">
                            <Heading level={6}>Approve plan</Heading>
                            <Fact label="Components" value={components} />
                            <Fact label="Pages" value={pages} />
                            <Fact label="Props inferred" value={totalProps} />
                            <Fact label="Estimated generation" value={estimated} />
                            {projection && projection.priorRuns > 0 ? (
                                <Text size="sm" className="text-neutral-strong">
                                    From {projection.priorRuns} prior run(s).
                                </Text>
                            ) : null}
                            <div className="rounded-sm bg-primary-subtle p-sm">
                                <Text size="sm" className="text-neutral-xstrong">
                                    Stages 1–6 are cheap. Approving starts generation, which spends
                                    inference budget for every component in this plan.
                                </Text>
                            </div>
                            <Button
                                variant="primary"
                                text={generating ? "Starting…" : "Approve plan and generate"}
                                disabled={generating}
                                onClick={() => void presenter.runStage("generate")}
                                className={cn("w-full")}
                            />
                            <Button
                                variant="tertiary"
                                text="Back to stage 5"
                                onClick={() => presenter.selectStage("classify")}
                                className={cn("w-full")}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {lightbox ? (
                <div
                    className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/70 p-xl"
                    onClick={() => setLightbox(null)}
                    title="Click to close"
                >
                    <div className="max-h-full overflow-y-auto rounded-sm bg-neutral-base">
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
