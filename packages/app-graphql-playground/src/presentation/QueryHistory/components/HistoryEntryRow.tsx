import React from "react";
import { ReactComponent as OpenInNewIcon } from "@webiny/icons/open_in_new.svg";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { QueryHistoryPresenter } from "../abstractions.js";

interface HistoryEntryRowProps {
    entry: QueryHistoryPresenter.EntryVm;
    onRestore: (entry: QueryHistoryPresenter.EntryVm) => void;
    onOpenInNewTab: (entry: QueryHistoryPresenter.EntryVm) => void;
    onRemove: (id: string) => void;
}

const formatRelativeTime = (timestamp: number): string => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);

    if (seconds < 60) {
        return "just now";
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
        return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
        return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

export const HistoryEntryRow = (props: HistoryEntryRowProps) => {
    return (
        <div
            className="px-4 py-2 hover:bg-neutral-subtle cursor-pointer border-b border-neutral-subtle group"
            onClick={() => props.onRestore(props.entry)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm text-neutral-primary truncate">
                        {props.entry.queryPreview}
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-neutral-dimmed">
                        <span>{props.entry.endpoint}</span>
                        <span>{formatRelativeTime(props.entry.timestamp)}</span>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0">
                    <button
                        className="p-1 text-neutral-dimmed hover:text-accent-primary bg-transparent border-none cursor-pointer"
                        onClick={ev => {
                            ev.stopPropagation();
                            props.onOpenInNewTab(props.entry);
                        }}
                        title="Open in new tab"
                    >
                        <OpenInNewIcon className="w-4 h-4" />
                    </button>
                    <button
                        className="p-1 text-neutral-dimmed hover:text-destructive-primary bg-transparent border-none cursor-pointer"
                        onClick={ev => {
                            ev.stopPropagation();
                            props.onRemove(props.entry.id);
                        }}
                        title="Remove"
                    >
                        <CloseIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
