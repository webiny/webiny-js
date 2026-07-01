import React, { useMemo, useState } from "react";
import { Button, Input, Text } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as InfoIcon } from "@webiny/icons/info.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import { VariantSplitRow } from "./VariantSplitRow.js";

export interface FormBucket {
    id: string;
    isControl: boolean;
    name: string;
    key: string;
    keyEdited: boolean;
    description: string;
    weight: number;
    // CMS revision id of an existing variant (edit mode); absent for control and new variants.
    revisionId?: string;
}

export interface ExperimentFormInitial {
    name: string;
    key: string;
    buckets: FormBucket[];
}

export interface NewExperimentPayload {
    name: string;
    key: string;
    control: { key: string; description: string; weight: number };
    variants: Array<{
        id: string;
        revisionId?: string;
        name: string;
        key: string;
        description: string;
        weight: number;
    }>;
}

interface Props {
    onCancel: () => void;
    onSubmit: (payload: NewExperimentPayload) => void;
    initial?: ExperimentFormInitial;
    submitLabel?: string;
    /** When false, variants can't be added/removed (used when editing an existing experiment). */
    allowStructureChange?: boolean;
}

const slugify = (value: string): string =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const defaultBuckets = (): FormBucket[] => [
    {
        id: "control",
        isControl: true,
        name: "Control",
        key: "control",
        keyEdited: false,
        description: "",
        weight: 50
    },
    {
        id: crypto.randomUUID(),
        isControl: false,
        name: "Variant B",
        key: "variant-b",
        keyEdited: false,
        description: "",
        weight: 50
    }
];

/** Even split summing to 100, with any remainder distributed from the first bucket. */
const evenSplit = (buckets: FormBucket[]): FormBucket[] => {
    const n = buckets.length;
    const each = Math.floor(100 / n);
    const next = buckets.map(b => ({ ...b, weight: each }));
    let used = each * n;
    let i = 0;
    while (used < 100) {
        next[i % n].weight += 1;
        used++;
        i++;
    }
    return next;
};

/** Set one bucket's weight and auto-balance the rest (proportionally) so the total stays 100. */
const rebalance = (buckets: FormBucket[], index: number, rawValue: number): FormBucket[] => {
    const value = Math.max(0, Math.min(100, Math.round(rawValue)));
    const next = buckets.map(b => ({ ...b }));
    next[index].weight = value;

    const others = next.map((b, i) => ({ b, i })).filter(x => x.i !== index);
    if (others.length === 0) {
        next[index].weight = 100;
        return next;
    }

    const remaining = 100 - value;
    const sumOthers = others.reduce((sum, x) => sum + x.b.weight, 0);

    if (sumOthers <= 0) {
        const each = Math.floor(remaining / others.length);
        others.forEach(x => (next[x.i].weight = each));
        let used = each * others.length;
        let k = 0;
        while (used < remaining) {
            next[others[k % others.length].i].weight += 1;
            used++;
            k++;
        }
    } else {
        let allocated = 0;
        others.forEach(x => {
            const w = Math.max(0, Math.round((x.b.weight / sumOthers) * remaining));
            next[x.i].weight = w;
            allocated += w;
        });
        const drift = remaining - allocated;
        if (drift !== 0) {
            const largest = others.reduce((a, b) => (next[a.i].weight >= next[b.i].weight ? a : b));
            next[largest.i].weight = Math.max(0, next[largest.i].weight + drift);
        }
    }

    return next;
};

export const NewExperimentForm = ({
    onCancel,
    onSubmit,
    initial,
    submitLabel = "Create experiment",
    allowStructureChange = true
}: Props) => {
    const [name, setName] = useState(initial?.name ?? "");
    const [key, setKey] = useState(initial?.key ?? "");
    const [keyEdited, setKeyEdited] = useState(Boolean(initial?.key));
    const [buckets, setBuckets] = useState<FormBucket[]>(initial?.buckets ?? defaultBuckets());

    const total = useMemo(() => buckets.reduce((sum, b) => sum + b.weight, 0), [buckets]);
    const variantCount = buckets.filter(b => !b.isControl).length;

    const onNameChange = (value: string) => {
        setName(value);
        if (!keyEdited) {
            setKey(slugify(value));
        }
    };

    const onKeyChange = (value: string) => {
        setKeyEdited(true);
        setKey(value);
    };

    const addVariant = () => {
        setBuckets(prev => {
            const count = prev.filter(b => !b.isControl).length;
            const variantName = `Variant ${String.fromCharCode(66 + count)}`;
            return evenSplit([
                ...prev,
                {
                    id: crypto.randomUUID(),
                    isControl: false,
                    weight: 0,
                    name: variantName,
                    key: slugify(variantName),
                    keyEdited: false,
                    description: ""
                }
            ]);
        });
    };

    const removeVariant = (index: number) => {
        setBuckets(prev => evenSplit(prev.filter((_, i) => i !== index)));
    };

    const changeWeight = (index: number, value: number) => {
        setBuckets(prev => rebalance(prev, index, value));
    };

    const changeName = (index: number, value: string) => {
        setBuckets(prev =>
            prev.map((b, i) =>
                i === index ? { ...b, name: value, key: b.keyEdited ? b.key : slugify(value) } : b
            )
        );
    };

    const changeKey = (index: number, value: string) => {
        setBuckets(prev =>
            prev.map((b, i) => (i === index ? { ...b, key: value, keyEdited: true } : b))
        );
    };

    const changeDescription = (index: number, value: string) => {
        setBuckets(prev => prev.map((b, i) => (i === index ? { ...b, description: value } : b)));
    };

    const canSubmit = name.trim().length > 0 && key.trim().length > 0;

    const submit = () => {
        if (!canSubmit) {
            return;
        }
        const control = buckets.find(b => b.isControl)!;
        const variants = buckets
            .filter(b => !b.isControl)
            .map(b => ({
                id: b.id,
                revisionId: b.revisionId,
                name: b.name,
                key: b.key,
                description: b.description,
                weight: b.weight
            }));

        onSubmit({
            name: name.trim(),
            key: key.trim(),
            control: { key: control.key, description: control.description, weight: control.weight },
            variants
        });
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                <div style={{ marginBottom: 20 }}>
                    <Input
                        label="Experiment name"
                        value={name}
                        onChange={onNameChange}
                        placeholder="e.g. Homepage CTA test"
                    />
                </div>

                <div style={{ marginBottom: 12 }}>
                    <Input
                        label="Experiment key"
                        value={key}
                        onChange={onKeyChange}
                        placeholder="homepage-cta-test"
                    />
                </div>

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        background: "#f5f5f5",
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 28
                    }}
                >
                    <InfoIcon style={{ width: 18, height: 18, flexShrink: 0, marginTop: 2 }} />
                    <Text size="sm">
                        This key is the identifier reported to your analytics platform to track this
                        experiment. Auto-generated from the name — edit it to override.
                    </Text>
                </div>

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4
                    }}
                >
                    <Text>Variants &amp; traffic split</Text>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: total === 100 ? "#0f9d58" : "#d93025"
                        }}
                    >
                        Total {total}%
                    </span>
                </div>
                <div style={{ marginBottom: 16 }}>
                    <Text size="sm">
                        Each variant is an independent copy of the page. Sliders auto-balance to
                        100%.
                    </Text>
                </div>

                {buckets.map((bucket, index) => (
                    <VariantSplitRow
                        key={bucket.id}
                        name={bucket.name}
                        variantKey={bucket.key}
                        description={bucket.description}
                        isControl={bucket.isControl}
                        weight={bucket.weight}
                        variantIndex={buckets.slice(0, index).filter(b => !b.isControl).length}
                        onNameChange={value => changeName(index, value)}
                        onKeyChange={value => changeKey(index, value)}
                        onDescriptionChange={value => changeDescription(index, value)}
                        onChange={value => changeWeight(index, value)}
                        onRemove={
                            bucket.isControl || !allowStructureChange || variantCount <= 1
                                ? undefined
                                : () => removeVariant(index)
                        }
                        removeIcon={<CloseIcon style={{ width: 14, height: 14 }} />}
                    />
                ))}

                {allowStructureChange ? (
                    <div style={{ marginTop: 8 }}>
                        <Button
                            variant="tertiary"
                            icon={<AddIcon />}
                            text="Add variant"
                            onClick={addVariant}
                        />
                    </div>
                ) : null}
            </div>

            <div
                style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                    padding: 16,
                    borderTop: "1px solid #eee"
                }}
            >
                <Button variant="secondary" text="Cancel" onClick={onCancel} />
                <Button
                    variant="primary"
                    text={submitLabel}
                    disabled={!canSubmit}
                    onClick={submit}
                />
            </div>
        </div>
    );
};
