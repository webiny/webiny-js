import React from "react";
import { IconButton, Text } from "@webiny/admin-ui";

const VARIANT_COLORS = ["#e2572a", "#4285f4", "#0f9d58", "#a142f4", "#f4b400"];

interface Props {
    label: string;
    isControl: boolean;
    weight: number;
    variantIndex: number;
    onChange: (value: number) => void;
    onRemove?: () => void;
    removeIcon: React.ReactNode;
}

export const VariantSplitRow = ({
    label,
    isControl,
    weight,
    variantIndex,
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
                    justifyContent: "space-between"
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color
                        }}
                    />
                    <Text>{label}</Text>
                </div>
                {isControl ? (
                    <span
                        style={{
                            fontSize: 12,
                            color: "#6b7280",
                            background: "#f2f2f2",
                            borderRadius: 6,
                            padding: "2px 8px"
                        }}
                    >
                        Control · current page
                    </span>
                ) : onRemove ? (
                    <IconButton variant="ghost" size="sm" icon={removeIcon} onClick={onRemove} />
                ) : null}
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
