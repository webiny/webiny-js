import React from "react";
import type { ConsoleMessage } from "../types.js";
import { OutputLine } from "./OutputLine.js";
import { MIN_PANE_PCT } from "../types.js";

interface OutputPanelProps {
    output: ConsoleMessage[];
}

export const OutputPanel: React.FC<OutputPanelProps> = ({ output }) => {
    return (
        <div
            className="bg-neutral-base flex flex-col overflow-hidden"
            style={{ flex: 1, width: "auto", minWidth: `${MIN_PANE_PCT}%` }}
        >
            <div className="p-2 border-b border-gray-200 font-bold">Output</div>
            <div className="p-2 overflow-auto flex-1">
                {output.length === 0 ? (
                    <div className="text-gray-400 italic">
                        Click &quot;Run Code&quot; to see output here...
                    </div>
                ) : (
                    output.map((msg, index) => <OutputLine key={index} message={msg} />)
                )}
            </div>
        </div>
    );
};
