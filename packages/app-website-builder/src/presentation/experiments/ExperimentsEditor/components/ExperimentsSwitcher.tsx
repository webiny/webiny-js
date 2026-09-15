import React, { useState } from "react";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as ChevronDownIcon } from "@webiny/icons/expand_more.svg";
import { ReactComponent as GlobeIcon } from "@webiny/icons/public.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ReactComponent as TuneIcon } from "@webiny/icons/tune.svg";

export interface ExperimentItem {
    id: string;
    name: string;
    status: "active" | "inactive";
}

interface Props {
    experiments: ExperimentItem[];
    selectedId: string | null;
    onSelect: (id: string | null) => void;
    onManage: () => void;
}

const Dot = ({ color }: { color: string }) => (
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

const StatusBadge = ({ status }: { status: ExperimentItem["status"] }) => {
    const active = status === "active";
    return (
        <span
            style={{
                fontSize: 12,
                fontWeight: 500,
                color: active ? "#0f9d58" : "#6b7280",
                background: active ? "#e6f4ea" : "#f2f2f2",
                borderRadius: 6,
                padding: "1px 8px",
                whiteSpace: "nowrap"
            }}
        >
            {active ? "Active" : "Inactive"}
        </span>
    );
};

interface RowProps {
    title: string;
    subtitle?: string;
    right?: React.ReactNode;
    selected: boolean;
}

const Row = ({ title, subtitle, right, selected }: RowProps) => (
    <div
        style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            gap: 8
        }}
    >
        <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontWeight: subtitle ? 600 : 400 }}>{title}</span>
            {subtitle ? <span style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</span> : null}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {right}
            {selected ? <CheckIcon style={{ width: 16, height: 16, color: "#e2572a" }} /> : null}
        </div>
    </div>
);

export const ExperimentsSwitcher = ({ experiments, selectedId, onSelect, onManage }: Props) => {
    const [open, setOpen] = useState(false);
    const selected = experiments.find(e => e.id === selectedId) ?? null;
    const label = selected ? selected.name : "Experiments";

    const trigger = (
        <button
            type="button"
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                border: "1px solid #f2c9ba",
                color: "#e2572a",
                background: "#fff",
                borderRadius: 8,
                padding: "6px 12px",
                fontWeight: 600,
                cursor: "pointer"
            }}
        >
            <ScienceIcon style={{ width: 18, height: 18, fill: "currentColor" }} />
            {label}
            <ChevronDownIcon style={{ width: 16, height: 16, fill: "currentColor" }} />
        </button>
    );

    return (
        <DropdownMenu
            open={open}
            onOpenChange={setOpen}
            trigger={trigger}
            style={{ minWidth: 320 }}
        >
            <DropdownMenu.Label text="Now viewing" />
            <DropdownMenu.Item
                icon={<GlobeIcon style={{ width: 18, height: 18 }} />}
                text={
                    <Row
                        title="Original page"
                        subtitle="No experiment applied"
                        selected={selectedId === null}
                    />
                }
                onClick={() => onSelect(null)}
            />
            <DropdownMenu.Separator />
            <DropdownMenu.Label text="Experiments" />
            {experiments.map(experiment => (
                <DropdownMenu.Item
                    key={experiment.id}
                    icon={<Dot color={experiment.status === "active" ? "#10b981" : "#9ca3af"} />}
                    text={
                        <Row
                            title={experiment.name}
                            right={<StatusBadge status={experiment.status} />}
                            selected={selectedId === experiment.id}
                        />
                    }
                    onClick={() => onSelect(experiment.id)}
                />
            ))}
            <DropdownMenu.Separator />
            <DropdownMenu.Item
                icon={<TuneIcon style={{ width: 18, height: 18 }} />}
                text="Manage experiments…"
                onClick={onManage}
            />
        </DropdownMenu>
    );
};
