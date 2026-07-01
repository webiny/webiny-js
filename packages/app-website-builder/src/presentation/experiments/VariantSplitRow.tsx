import React from "react";
import { IconButton, Input } from "@webiny/admin-ui";
import { bucketColor } from "./variantColors.js";

interface FieldProps {
    label: string;
    children: React.ReactNode;
}

const Field = ({ label, children }: FieldProps) => {
    return (
        <div style={{ marginTop: 12 }}>
            <div
                style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: "#6b7280",
                    marginBottom: 6
                }}
            >
                {label}
            </div>
            {children}
        </div>
    );
};

interface Props {
    name: string;
    variantKey: string;
    description: string;
    isControl: boolean;
    weight: number;
    variantIndex: number;
    onNameChange: (value: string) => void;
    onKeyChange: (value: string) => void;
    onDescriptionChange: (value: string) => void;
    onChange: (value: number) => void;
    onRemove?: () => void;
    removeIcon: React.ReactNode;
}

export const VariantSplitRow = ({
    name,
    variantKey,
    description,
    isControl,
    weight,
    variantIndex,
    onNameChange,
    onKeyChange,
    onDescriptionChange,
    onChange,
    onRemove,
    removeIcon
}: Props) => {
    const color = bucketColor(isControl, variantIndex);

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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                        style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: color,
                            flexShrink: 0
                        }}
                    />
                    <span style={{ fontWeight: 600 }}>
                        {isControl ? "Control" : name || "Variant"}
                    </span>
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
                        Current page
                    </span>
                ) : onRemove ? (
                    <IconButton variant="ghost" size="sm" icon={removeIcon} onClick={onRemove} />
                ) : null}
            </div>

            <Field label="Name">
                <Input
                    value={name}
                    onChange={onNameChange}
                    disabled={isControl}
                    placeholder="Variant name"
                />
            </Field>

            <Field label="Key">
                <Input value={variantKey} onChange={onKeyChange} placeholder="variant-key" />
            </Field>

            <Field label="Description">
                <Input value={description} onChange={onDescriptionChange} placeholder="Optional" />
            </Field>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                        textTransform: "uppercase",
                        color: "#6b7280"
                    }}
                >
                    Traffic
                </span>
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
