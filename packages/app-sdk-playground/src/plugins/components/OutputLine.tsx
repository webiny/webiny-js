import React from "react";
import type { ConsoleMessage } from "../types.js";

export const OutputLine: React.FC<{ message: ConsoleMessage }> = ({ message }) => {
    const colorClasses: Record<ConsoleMessage["type"], string> = {
        log: "text-neutral-primary",
        error: "text-destructive-primary",
        warn: "text-orange-600",
        info: "text-accent-primary"
    };

    return (
        <div
            className={`font-mono text-[13px] mb-1 whitespace-pre-wrap break-words ${colorClasses[message.type]}`}
        >
            <span className="text-neutral-dimmed text-[11px]">
                [{new Date(message.timestamp).toLocaleTimeString()}]
            </span>{" "}
            {message.message}
        </div>
    );
};
