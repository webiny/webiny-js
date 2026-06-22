import React from "react";
import { Button } from "@webiny/admin-ui";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as AutoFixHighIcon } from "@webiny/icons/auto_fix_high.svg";
import { Loader } from "@webiny/admin-ui";

interface PlaygroundToolbarProps {
    isRunning: boolean;
    onRun: () => void;
    onFormat: () => void;
}

export const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = ({
    isRunning,
    onRun,
    onFormat
}) => {
    return (
        <div className="flex justify-between items-center px-4 py-2 bg-neutral-base border-b border-gray-200 shadow-sm">
            <div>
                <strong>SDK Playground</strong>
                <span className="ml-4 text-xs text-gray-600">
                    Use {navigator.platform.startsWith("Mac") ? "Cmd" : "Ctrl"}+Enter to run code
                </span>
            </div>
            <div className="flex gap-2 items-center">
                <Button onClick={onFormat} icon={<AutoFixHighIcon />} variant={"secondary"}>
                    Format
                </Button>
                <Button
                    onClick={onRun}
                    disabled={isRunning}
                    icon={
                        isRunning ? <Loader size={"xs"} variant={"negative"} /> : <PlayArrowIcon />
                    }
                >
                    {isRunning ? "Running..." : "Run Code"}
                </Button>
            </div>
        </div>
    );
};
