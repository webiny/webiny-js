import React, { useState } from "react";
import { ReactComponent as ScienceIcon } from "@webiny/icons/science.svg";
import { ReactComponent as PauseIcon } from "@webiny/icons/pause.svg";
import { ReactComponent as PlayIcon } from "@webiny/icons/play_arrow.svg";
import { useExperimentsEditor } from "./ExperimentsEditorContext.js";
import type { ExperimentDto } from "~/features/experiments/index.js";

/**
 * Top-bar indicator shown on a published (read-only) page: names the running experiment, shows
 * whether it's live (Active) or paused (Inactive), and lets the editor toggle the kill-switch.
 */
export const ExperimentIndicator = ({ experiment }: { experiment: ExperimentDto }) => {
    const { paused, pauseSelected, resumeSelected } = useExperimentsEditor();
    const [busy, setBusy] = useState(false);
    const active = !paused;

    const toggle = async () => {
        setBusy(true);
        try {
            await (paused ? resumeSelected() : pauseSelected());
        } finally {
            setBusy(false);
        }
    };

    const toggleStyle: React.CSSProperties = {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        borderRadius: 8,
        padding: "6px 12px",
        fontWeight: 600,
        fontSize: 13,
        cursor: busy ? "default" : "pointer",
        opacity: busy ? 0.6 : 1,
        ...(active
            ? { border: "1px solid #d5d7db", background: "#fff", color: "#1f2937" }
            : { border: "none", background: "#10b981", color: "#fff" })
    };

    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "4px 4px 4px 12px",
                background: "#fff"
            }}
        >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <ScienceIcon
                    style={{ width: 18, height: 18, color: "#e2572a", fill: "currentColor" }}
                />
                <span
                    style={{
                        fontWeight: 600,
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
                        whiteSpace: "nowrap"
                    }}
                >
                    <span
                        style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: active ? "#10b981" : "#9ca3af"
                        }}
                    />
                    {active ? "Active" : "Inactive"}
                </span>
            </span>
            <button type="button" onClick={toggle} disabled={busy} style={toggleStyle}>
                {active ? (
                    <PauseIcon style={{ width: 16, height: 16, fill: "currentColor" }} />
                ) : (
                    <PlayIcon style={{ width: 16, height: 16, fill: "currentColor" }} />
                )}
                {active ? "Pause" : "Resume"}
            </button>
        </div>
    );
};
