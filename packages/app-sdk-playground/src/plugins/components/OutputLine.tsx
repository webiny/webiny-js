import React from "react";
import type { ConsoleMessage } from "../types.js";

export const OutputLine: React.FC<{ message: ConsoleMessage }> = ({ message }) => {
    const colorClasses: Record<ConsoleMessage["type"], string> = {
        log: "text-gray-800",
        error: "text-red-700",
        warn: "text-orange-600",
        info: "text-blue-600"
    };

    return (
        <div
            className={`font-mono text-[13px] mb-1 whitespace-pre-wrap break-words ${colorClasses[message.type]}`}
        >
            <span className="text-gray-400 text-[11px]">
                [{new Date(message.timestamp).toLocaleTimeString()}]
            </span>{" "}
            {message.message}
        </div>
    );
};
