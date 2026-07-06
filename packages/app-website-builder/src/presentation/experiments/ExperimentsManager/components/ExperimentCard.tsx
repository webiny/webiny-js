import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as PauseIcon } from "@webiny/icons/pause.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import type { ExperimentDto } from "~/features/experiments/index.js";
import type { ExperimentCardViewModel } from "../abstractions/ExperimentsManagerPresenter.js";

interface Props {
    card: ExperimentCardViewModel;
    onEdit: (experiment: ExperimentDto) => void;
    onActivate: (experiment: ExperimentDto) => void;
    onDeactivate: (experiment: ExperimentDto) => void;
    onDelete: (experiment: ExperimentDto) => void;
}

const Dot = ({ color }: { color: string }) => (
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
);

/** A single page thumbnail — a black header, a couple of placeholder lines and a coloured band. */
const Thumbnail = ({ band }: { band: string }) => (
    <div
        style={{
            border: "1px solid #e5e7eb",
            borderRadius: 6,
            overflow: "hidden",
            background: "#fff"
        }}
    >
        <div style={{ height: 18, background: "#000" }} />
        <div style={{ padding: "8px 8px 0" }}>
            <div style={{ height: 4, borderRadius: 2, background: "#e5e7eb", width: "70%" }} />
            <div
                style={{
                    height: 4,
                    borderRadius: 2,
                    background: "#eef0f2",
                    width: "45%",
                    marginTop: 4
                }}
            />
        </div>
        <div style={{ height: 14, background: band, marginTop: 8 }} />
    </div>
);

export const ExperimentCard = observer(function ExperimentCard({
    card,
    onEdit,
    onActivate,
    onDeactivate,
    onDelete
}: Props) {
    const { experiment, active, buckets, variantCount } = card;

    return (
        <div
            style={{
                border: active ? "1px solid #b7e4c7" : "1px solid #e5e7eb",
                background: active ? "#f4fbf6" : "#fff",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 8
                }}
            >
                <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                            style={{
                                fontWeight: 600,
                                fontSize: 15,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis"
                            }}
                        >
                            {experiment.name}
                        </span>
                        <span
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 5,
                                fontSize: 12,
                                fontWeight: 500,
                                color: active ? "#0f9d58" : "#6b7280",
                                background: active ? "transparent" : "#f2f2f2",
                                borderRadius: 6,
                                padding: active ? 0 : "1px 8px",
                                whiteSpace: "nowrap"
                            }}
                        >
                            {active ? <Dot color="#10b981" /> : null}
                            {active ? "Active" : "Inactive"}
                        </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
                        {variantCount} variant{variantCount === 1 ? "" : "s"} · splitting traffic
                    </div>
                </div>
                {active ? (
                    <Button
                        variant="secondary"
                        icon={<PauseIcon />}
                        text="Deactivate"
                        onClick={() => onDeactivate(experiment)}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => onActivate(experiment)}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            border: "none",
                            background: "#10b981",
                            color: "#fff",
                            borderRadius: 8,
                            padding: "7px 14px",
                            fontWeight: 600,
                            fontSize: 13,
                            cursor: "pointer",
                            whiteSpace: "nowrap"
                        }}
                    >
                        <PlayIcon style={{ width: 18, height: 18, fill: "currentColor" }} />
                        Activate
                    </button>
                )}
            </div>

            {/* Thumbnails */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${buckets.length}, 1fr)`,
                    gap: 10,
                    marginTop: 16
                }}
            >
                {buckets.map(bucket => (
                    <div key={bucket.key}>
                        <Thumbnail band={bucket.band} />
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: 6,
                                marginTop: 8
                            }}
                        >
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                    minWidth: 0
                                }}
                            >
                                <Dot color={bucket.dot} />
                                <span
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis"
                                    }}
                                >
                                    {bucket.name}
                                </span>
                            </span>
                            <span style={{ fontSize: 13, color: "#6b7280" }}>{bucket.weight}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Traffic bar */}
            <div
                style={{
                    display: "flex",
                    height: 8,
                    borderRadius: 4,
                    overflow: "hidden",
                    marginTop: 16,
                    background: "#eef0f2"
                }}
            >
                {buckets.map(bucket => (
                    <div
                        key={bucket.key}
                        style={{ width: `${bucket.weight}%`, background: bucket.dot }}
                    />
                ))}
            </div>

            {/* Legend */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 16,
                    marginTop: 12
                }}
            >
                {buckets.map(bucket => (
                    <span
                        key={bucket.key}
                        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}
                    >
                        <Dot color={bucket.dot} />
                        <span style={{ color: "#374151" }}>{bucket.name}</span>
                        <span style={{ color: "#9ca3af" }}>·</span>
                        <span style={{ fontWeight: 600 }}>{bucket.weight}%</span>
                    </span>
                ))}
            </div>

            {/* Footer */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: "1px solid #eef0f2"
                }}
            >
                <Button
                    variant="secondary"
                    icon={<EditIcon />}
                    text="Edit"
                    onClick={() => onEdit(experiment)}
                />
                <button
                    type="button"
                    onClick={() => onDelete(experiment)}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #f0d0cb",
                        background: "#fff",
                        color: "#d93025",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: "pointer"
                    }}
                >
                    <DeleteIcon style={{ width: 18, height: 18, fill: "currentColor" }} />
                    Delete
                </button>
            </div>
        </div>
    );
});
