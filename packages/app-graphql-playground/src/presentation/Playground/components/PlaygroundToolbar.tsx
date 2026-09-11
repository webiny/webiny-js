import React from "react";
import { observer } from "mobx-react-lite";
import { Button } from "@webiny/admin-ui";
import { Loader } from "@webiny/admin-ui";
import { ReactComponent as PlayArrowIcon } from "@webiny/icons/play_arrow.svg";
import { ReactComponent as AutoFixHighIcon } from "@webiny/icons/auto_fix_high.svg";
import { ReactComponent as ContentCopyIcon } from "@webiny/icons/content_copy.svg";
import { ReactComponent as MenuBookIcon } from "@webiny/icons/menu_book.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import type { PlaygroundPresenter } from "../abstractions.js";
import type { DocsExplorerPresenter } from "../../DocsExplorer/abstractions.js";
import type { QueryHistoryPresenter } from "../../QueryHistory/abstractions.js";

interface PlaygroundToolbarProps {
    presenter: PlaygroundPresenter.Interface;
    docsPresenter: DocsExplorerPresenter.Interface;
    historyPresenter: QueryHistoryPresenter.Interface;
}

const isMac =
    (typeof navigator !== "undefined" &&
        (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
            ?.platform === "macOS") ||
    (typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent));
const shortcutKey = isMac ? "Cmd" : "Ctrl";

export const PlaygroundToolbar = observer((props: PlaygroundToolbarProps) => {
    const vm = props.presenter.vm;
    const isExecuting = vm.activeTab ? vm.activeTab.isExecuting : false;

    return (
        <div className="flex justify-between items-center px-4 py-2 bg-neutral-base border-b border-neutral-dimmed shadow-sm">
            <div>
                <strong>GraphQL Playground</strong>
                <span className="ml-4 text-xs text-neutral-muted">
                    {shortcutKey}+Enter to execute
                </span>
            </div>
            <div className="flex gap-2 items-center">
                <Button
                    onClick={() => props.historyPresenter.toggle()}
                    icon={<HistoryIcon />}
                    variant={props.historyPresenter.vm.open ? "primary" : "secondary"}
                >
                    History
                </Button>
                <Button
                    onClick={() => props.docsPresenter.toggle()}
                    icon={<MenuBookIcon />}
                    variant={props.docsPresenter.vm.open ? "primary" : "secondary"}
                >
                    Docs
                </Button>
                <Button
                    onClick={() => props.presenter.copyResponse()}
                    icon={<ContentCopyIcon />}
                    variant="secondary"
                >
                    Copy Response
                </Button>
                <Button
                    onClick={() => props.presenter.copyQuery()}
                    icon={<ContentCopyIcon />}
                    variant="secondary"
                >
                    Copy Query
                </Button>
                <Button
                    onClick={() => props.presenter.prettifyQuery()}
                    icon={<AutoFixHighIcon />}
                    variant="secondary"
                >
                    Prettify
                </Button>
                <Button
                    onClick={() => props.presenter.executeQuery()}
                    disabled={isExecuting}
                    icon={isExecuting ? <Loader size="xs" variant="negative" /> : <PlayArrowIcon />}
                >
                    {isExecuting ? "Executing..." : "Execute"}
                </Button>
            </div>
        </div>
    );
});
