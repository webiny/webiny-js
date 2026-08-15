import React, { useState } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { Button, Heading, Icon, Input, Select, Tag, Text, cn } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as RegenerateIcon } from "@webiny/icons/autorenew.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
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

// The prop table's shared column template — header and every row use it so the columns line up.
const PROP_COLS =
    "grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-md";

const pageCountOf = (component: PlannedComponentDto): number =>
    new Set(component.members.map(member => member.url)).size;

const hasOverride = (overrides: OverrideDto[], signature: string): boolean =>
    overrides.some(
        override => override.stage === "plan" && override.structuralSignature === signature
    );

/**
 * The "values observed" phrase. The plan only carries a capped sample of values per prop (≤10), not true
 * frequency stats, so this reports the distinct sample count — with a trailing "+" when the sample hit
 * its cap — and keeps the actual values in a tooltip. (The design's richer forms — "present on 4 of 6",
 * "0.5 (4), 0.32 (2)" — need occurrence counts the Plan stage does not emit yet.)
 */
const valuesObserved = (prop: ComponentPropDto): { label: string; title: string } => {
    const distinct = [...new Set(prop.observedValues ?? [])];
    if (distinct.length === 0) {
        return { label: "—", title: "" };
    }
    const capped = (prop.observedValues?.length ?? 0) >= 10;
    const plural = distinct.length === 1 ? "value" : "values";
    return {
        label: `${distinct.length}${capped ? "+" : ""} distinct ${plural}`,
        title: distinct.join(" · ")
    };
};

/** A row-level icon button (edit / delete) — a muted glyph that darkens on hover. */
const IconButton = ({
    icon,
    label,
    active,
    disabled,
    onClick
}: {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) => (
    <button
        type="button"
        title={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(
            "inline-flex cursor-pointer items-center justify-center rounded-sm p-xxs transition-colors",
            active ? "text-primary-default" : "text-neutral-strong hover:text-neutral-xstrong",
            "hover:bg-neutral-light disabled:cursor-not-allowed disabled:opacity-50"
        )}
    >
        <Icon icon={icon} label={label} size="sm" />
    </button>
);

/** One prop row (spec §6.6): prop · type · values observed · edit/delete. Editing is behind the pencil. */
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
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(prop.name);
    const observed = valuesObserved(prop);

    const commitName = () => {
        if (name.trim() && name.trim() !== prop.name) {
            void presenter.setPlanProp(signature, "edit", prop.name, { newName: name.trim() });
        }
    };
    const typeOptions = PROP_TYPES.some(option => option.value === prop.type)
        ? PROP_TYPES
        : [{ value: prop.type, label: prop.type }, ...PROP_TYPES];

    return (
        <div
            className={cn(
                PROP_COLS,
                "border-t border-neutral-dimmed px-sm py-xs hover:bg-neutral-light/40"
            )}
        >
            {editing ? (
                <Input
                    value={name}
                    disabled={vm.clusterBusy}
                    onChange={(value: string) => setName(value)}
                    onBlur={commitName}
                    onEnter={commitName}
                />
            ) : (
                <Text size="md" className="truncate font-mono">
                    {prop.name}
                </Text>
            )}

            {editing ? (
                <Select
                    value={prop.type}
                    options={typeOptions}
                    disabled={vm.clusterBusy}
                    onChange={(value: string) =>
                        void presenter.setPlanProp(signature, "edit", prop.name, { type: value })
                    }
                />
            ) : (
                <Text size="md" className="truncate font-mono text-neutral-strong">
                    {prop.type}
                </Text>
            )}

            <Text size="sm" className="truncate text-neutral-strong" title={observed.title}>
                {observed.label}
            </Text>

            <div className="flex items-center justify-end gap-xxs">
                <IconButton
                    icon={<EditIcon />}
                    label={editing ? "Done" : "Edit"}
                    active={editing}
                    disabled={vm.clusterBusy}
                    onClick={() => setEditing(open => !open)}
                />
                <IconButton
                    icon={<DeleteIcon />}
                    label="Delete"
                    disabled={vm.clusterBusy}
                    onClick={() => void presenter.setPlanProp(signature, "remove", prop.name)}
                />
            </div>
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
    const [showAdd, setShowAdd] = useState(false);
    const [newPropName, setNewPropName] = useState("");
    const [newPropType, setNewPropType] = useState("text");
    const [showInstruction, setShowInstruction] = useState(false);
    const [instruction, setInstruction] = useState("");
    const regenerating = vm.planRegenerating.includes(component.signature);
    const pages = pageCountOf(component);

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
            setShowAdd(false);
        }
    };

    const boundTokens = [...new Set(component.tokenBindings.map(binding => binding.token))];

    return (
        <div className="flex flex-col rounded-lg border border-neutral-dimmed bg-neutral-base">
            {/* Card header: crop · name/type/pages/bindings · add + regenerate */}
            <div className="flex items-start gap-sm p-sm">
                <div
                    className="aspect-[3/2] w-24 flex-shrink-0 overflow-hidden rounded-xs border border-neutral-dimmed bg-neutral-light"
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
                        <Text size="lg" className="truncate font-mono font-semibold">
                            {component.name}
                        </Text>
                        <Tag variant="neutral-muted" content={component.type} />
                        {corrected ? <Tag variant="accent" content="corrected" /> : null}
                        <Text size="sm" className="whitespace-nowrap text-neutral-strong">
                            {pages} page{pages === 1 ? "" : "s"}
                        </Text>
                    </div>
                    {boundTokens.length > 0 ? (
                        <Text size="sm" className="text-neutral-strong">
                            Binds to {themeLabel} — {boundTokens.join(", ")}
                        </Text>
                    ) : (
                        <Text size="sm" className="text-neutral-strong">
                            No token bindings
                        </Text>
                    )}
                </div>
                <div className="flex flex-shrink-0 items-center gap-sm">
                    <Button
                        variant="tertiary"
                        size="sm"
                        icon={<AddIcon />}
                        text="Add prop"
                        disabled={vm.clusterBusy}
                        onClick={() => setShowAdd(open => !open)}
                    />
                    <Button
                        variant="secondary"
                        size="sm"
                        icon={<RegenerateIcon />}
                        text={regenerating ? "Regenerating…" : "Regenerate props"}
                        disabled={regenerating || vm.clusterBusy}
                        title="Re-propose all props and token bindings for this component"
                        onClick={() => setShowInstruction(open => !open)}
                    />
                </div>
            </div>

            {/* Optional guidance for a regenerate. */}
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

            {/* Prop table. */}
            <div className="border-t border-neutral-dimmed">
                <div className={cn(PROP_COLS, "bg-neutral-light/50 px-sm py-xs")}>
                    {["Prop", "Type", "Values observed"].map(header => (
                        <Text
                            key={header}
                            size="sm"
                            className="uppercase tracking-wide text-neutral-muted"
                        >
                            {header}
                        </Text>
                    ))}
                    <span />
                </div>

                {component.props.map(prop => (
                    <PropRow
                        key={prop.name}
                        presenter={presenter}
                        signature={component.signature}
                        prop={prop}
                    />
                ))}

                {component.props.length === 0 && !showAdd ? (
                    <div className="px-sm py-sm">
                        <Text size="sm" className="text-neutral-strong">
                            No props inferred. Use “Add prop” to define one.
                        </Text>
                    </div>
                ) : null}

                {showAdd ? (
                    <div
                        className={cn(
                            PROP_COLS,
                            "border-t border-neutral-dimmed bg-neutral-light/30 px-sm py-xs"
                        )}
                    >
                        <Input
                            value={newPropName}
                            placeholder="Prop name"
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
                        <span />
                        <div className="flex items-center justify-end gap-xs">
                            <Button
                                variant="secondary"
                                size="sm"
                                text="Add"
                                disabled={!newPropName.trim() || vm.clusterBusy}
                                onClick={addProp}
                            />
                            <Button
                                variant="tertiary"
                                size="sm"
                                text="Cancel"
                                onClick={() => {
                                    setNewPropName("");
                                    setShowAdd(false);
                                }}
                            />
                        </div>
                    </div>
                ) : null}
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
