import React from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { useState } from "react";
import type { PlaygroundPresenter } from "../abstractions.js";

interface TabContextMenuProps {
    presenter: PlaygroundPresenter.Interface;
    tabId: string;
    isRegistered: boolean;
    x: number;
    y: number;
    onClose: () => void;
}

export const TabContextMenu = (props: TabContextMenuProps) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState("");
    const menuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const controller = new AbortController();

        document.addEventListener(
            "mousedown",
            (ev: MouseEvent) => {
                if (!menuRef.current) {
                    return;
                }

                if (menuRef.current.contains(ev.target as Node)) {
                    return;
                }

                props.onClose();
            },
            { signal: controller.signal }
        );

        return () => {
            controller.abort();
        };
    }, [props.onClose]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    const handleDuplicate = useCallback(() => {
        props.presenter.duplicateTab(props.tabId);
        props.onClose();
    }, [props.presenter, props.tabId, props.onClose]);

    const handleStartRename = useCallback(() => {
        const tab = props.presenter.vm.tabs.find(t => t.id === props.tabId);
        if (!tab) {
            return;
        }

        setRenameValue(tab.name);
        setIsRenaming(true);
    }, [props.presenter, props.tabId]);

    const handleConfirmRename = useCallback(() => {
        const trimmed = renameValue.trim();
        if (trimmed) {
            props.presenter.renameTab(props.tabId, trimmed);
        }
        props.onClose();
    }, [props.presenter, props.tabId, renameValue, props.onClose]);

    const handleRenameKeyDown = useCallback(
        (ev: React.KeyboardEvent) => {
            if (ev.key === "Enter") {
                handleConfirmRename();
            }
            if (ev.key === "Escape") {
                props.onClose();
            }
        },
        [handleConfirmRename, props.onClose]
    );

    if (isRenaming) {
        return (
            <div
                ref={menuRef}
                className="fixed z-50 bg-neutral-elevated border border-neutral-dimmed rounded shadow-lg p-2"
                style={{ left: props.x, top: props.y }}
            >
                <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={ev => setRenameValue(ev.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleConfirmRename}
                    className="px-2 py-1 border border-neutral-muted rounded text-sm w-40"
                />
            </div>
        );
    }

    return (
        <div
            ref={menuRef}
            className="fixed z-50 bg-neutral-elevated border border-neutral-dimmed rounded shadow-lg py-1 min-w-32"
            style={{ left: props.x, top: props.y }}
        >
            <button
                className="w-full px-4 py-1.5 text-left text-sm hover:bg-neutral-light"
                onClick={handleDuplicate}
            >
                Duplicate
            </button>
            <RenameButton isRegistered={props.isRegistered} onStartRename={handleStartRename} />
        </div>
    );
};

interface RenameButtonProps {
    isRegistered: boolean;
    onStartRename: () => void;
}

/* Only renders the rename option for user tabs. */
const RenameButton = (props: RenameButtonProps) => {
    if (props.isRegistered) {
        return null;
    }

    return (
        <button
            className="w-full px-4 py-1.5 text-left text-sm hover:bg-neutral-light"
            onClick={props.onStartRename}
        >
            Rename
        </button>
    );
};
