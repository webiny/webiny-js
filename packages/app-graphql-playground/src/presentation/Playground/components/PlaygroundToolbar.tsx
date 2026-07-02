import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { Loader } from "@webiny/admin-ui";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as AutoFixHighIcon } from "@webiny/icons/auto_fix_high.svg";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import type { PlaygroundPresenter } from "../abstractions.js";

interface PlaygroundToolbarProps {
    presenter: PlaygroundPresenter.Interface;
}

const isMac =
    (typeof navigator !== "undefined" &&
        (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
            ?.platform === "macOS") ||
    (typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent));
const shortcutKey = isMac ? "Cmd" : "Ctrl";

export const PlaygroundToolbar: React.FC<PlaygroundToolbarProps> = observer(
    function PlaygroundToolbar({ presenter }) {
        const vm = presenter.vm;
        const isExecuting = vm.activeTab ? vm.activeTab.isExecuting : false;

        return (
            <div className="flex justify-between items-center px-4 py-2 bg-white border-b border-gray-200 shadow-sm">
                <div>
                    <strong>GraphQL Playground</strong>
                    <span className="ml-4 text-xs text-gray-500">
                        {shortcutKey}+Enter to execute
                    </span>
                </div>
                <div className="flex gap-2 items-center">
                    <Button
                        onClick={() => presenter.copyResponse()}
                        icon={<ContentCopyIcon />}
                        variant="secondary"
                    >
                        Copy Response
                    </Button>
                    <Button
                        onClick={() => presenter.copyQuery()}
                        icon={<ContentCopyIcon />}
                        variant="secondary"
                    >
                        Copy Query
                    </Button>
                    <Button
                        onClick={() => presenter.prettifyQuery()}
                        icon={<AutoFixHighIcon />}
                        variant="secondary"
                    >
                        Prettify
                    </Button>
                    <Button
                        onClick={() => presenter.executeQuery()}
                        disabled={isExecuting}
                        icon={
                            isExecuting ? (
                                <Loader size="xs" variant="negative" />
                            ) : (
                                <PlayArrowIcon />
                            )
                        }
                    >
                        {isExecuting ? "Executing..." : "Execute"}
                    </Button>
                </div>
            </div>
        );
    }
);
