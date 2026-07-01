import React from "react";
import { IconButton, Input, Text } from "@webiny/admin-ui";

const VARIANT_COLORS = ["#e2572a", "#4285f4", "#0f9d58", "#a142f4", "#f4b400"];

interface Props {
    name: string;
    description: string;
    isControl: boolean;
    weight: number;
    variantIndex: number;
    onNameChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onChange: (value: number) => void;
    onRemove?: () => void;
    removeIcon: React.ReactNode;
}

export const VariantSplitRow = ({
    name,
    description,
    isControl,
    weight,
    variantIndex,
    onNameChange,
    onDescriptionChange,
    onChange,
    onRemove,
    removeIcon
}: Props) => {
    const color = isControl ? "#9ca3af" : VARIANT_COLORS[variantIndex % VARIANT_COLORS.length];

    return (
        <div
            style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 16,
                marginBottom: 12
            }}
        >
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0
                        }}
                    />
                    {isControl ? (
                        <Text>Control</Text>
                    ) : (
                        <div style={{ flex: 1 }}>
                            <Input
                                value={name}
                                onChange={onNameChange}
                                placeholder="Variant name"
                            />
                        </div>
                    )}
                </div>
                {isControl ? (
                    <span
                        style={{
                            fontSize: 12,
                            color: "#6b7280",
                            background: "#f2f2f2",
                            borderRadius: 6,
                            padding: "2px 8px",
                            whiteSpace: "nowrap"
                        }}
                    >
                        Control · current page
                    </span>
                ) : onRemove ? (
                    <IconButton variant="ghost" size="sm" icon={removeIcon} onClick={onRemove} />
                ) : null}
            </div>

            <div style={{ marginTop: 8 }}>
                <Input
                    value={description}
                    onChange={onDescriptionChange}
                    placeholder="Add a description (optional)"
                />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
                <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={weight}
                    onChange={event => onChange(Number(event.target.value))}
                    style={{ flex: 1, accentColor: color }}
                />
                <span style={{ width: 44, textAlign: "right", fontWeight: 600, fontSize: 14 }}>
                    {weight}%
                </span>
            </div>
        </div>
    );
};
