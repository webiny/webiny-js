import React, { useState } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as SwapIcon } from "@webiny/icons/swap_horiz.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { useExperimentsEditor } from "./ExperimentsEditorContext.js";
import { bucketColor } from "./variantColors.js";

const Dot = ({ color }: { color: string }) => (
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

/**
 * A bar shown between the address bar and the canvas while an experiment is selected. It names the
 * experiment, shows its status and the bucket currently being edited, and lets the editor switch
 * between the control and each variant or jump to editing the experiment.
 */
export const ExperimentPreviewToolbar = () => {
    const { selectedExperiment, selectedVariantId, selectVariant, variantOptions, editExperiment } =
        useExperimentsEditor();
    const [open, setOpen] = useState(false);

    if (!selectedExperiment) {
        return null;
    }

    const active = selectedExperiment.status === "running";
    // Assign each bucket its palette colour by index (control is first), matching the experiment
    // form and the list cards.
    const options = variantOptions.map((option, index) => ({
        ...option,
        color: bucketColor(option.isControl, index - 1)
    }));
    const current = options.find(option => option.id === selectedVariantId) ?? options[0];

    const trigger = (
        <button
            type="button"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #d5d7db",
                background: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer"
            }}
        >
            <SwapIcon style={{ width: 18, height: 18 }} />
            Switch variant
        </button>
    );

    return (
        <div
            className="w-full bg-neutral-base border-solid border-b-sm border-neutral-dimmed"
            data-affects-preview={"height"}
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "8px 16px",
                minHeight: 48
            }}
        >
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <ScienceIcon style={{ width: 18, height: 18, color: "#e2572a", flexShrink: 0 }} />
                <span
                    style={{
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                    }}
                >
                    {selectedExperiment.name}
                </span>
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 12,
                        fontWeight: 500,
                        color: active ? "#0f9d58" : "#6b7280",
                        whiteSpace: "nowrap"
                    }}
                >
                    <Dot color={active ? "#10b981" : "#9ca3af"} />
                    {active ? "Active" : "Inactive"}
                </span>

                <span style={{ width: 1, height: 20, background: "#e5e7eb", flexShrink: 0 }} />

                <span style={{ fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>
                    You&apos;re editing
                </span>
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        background: "#3c4043",
                        color: "#fff",
                        borderRadius: 8,
                        padding: "4px 10px",
                        fontSize: 13,
                        fontWeight: 600,
                        whiteSpace: "nowrap"
                    }}
                >
                    <Dot color={current.color} />
                    {current.name}
                    <span style={{ opacity: 0.7, fontWeight: 500 }}>{current.weight}%</span>
                </span>
            </div>

            <DropdownMenu
                open={open}
                onOpenChange={setOpen}
                trigger={trigger}
                style={{ minWidth: 260 }}
            >
                <DropdownMenu.Label text="Switch variant" />
                {options.map(option => (
                    <DropdownMenu.Item
                        key={option.id ?? "control"}
                        icon={<Dot color={option.color} />}
                        text={
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    width: "100%",
                                    gap: 8
                                }}
                            >
                                <span>{option.name}</span>
                                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <span style={{ fontSize: 12, color: "#6b7280" }}>
                                        {option.weight}%
                                    </span>
                                    {option.id === current.id ? (
                                        <CheckIcon
                                            style={{ width: 16, height: 16, color: option.color }}
                                        />
                                    ) : null}
                                </span>
                            </span>
                        }
                        onClick={() => selectVariant(option.id)}
                    />
                ))}
                <DropdownMenu.Separator />
                <DropdownMenu.Item
                    icon={<EditIcon style={{ width: 18, height: 18 }} />}
                    text="Edit experiment"
                    onClick={() => editExperiment(selectedExperiment)}
                />
            </DropdownMenu>
        </div>
    );
};
